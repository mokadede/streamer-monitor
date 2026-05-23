import { createClient } from '@supabase/supabase-js';

export default async function handler(request, response) {
  try {
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY; // Or Service Role Key

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return response.status(500).json({ error: 'Missing Supabase URL or Key' });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // API Keys Fallback Array
    const API_KEYS = [
      process.env.VITE_YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEY,
      process.env.YOUTUBE_API_KEY_FALLBACK,
    ].filter(Boolean);

    if (API_KEYS.length === 0) {
      return response.status(500).json({ error: 'Missing YouTube API Keys' });
    }

    let currentKeyIndex = 0;

    function getApiKey() {
      return API_KEYS[currentKeyIndex];
    }

    function nextApiKey() {
      if (currentKeyIndex < API_KEYS.length - 1) {
        currentKeyIndex++;
        console.log(`[!] API Key limit reached. Switching to Backup API Key...`);
        return true;
      }
      console.error('[!!!] All API Keys have exhausted their quotas.');
      return false;
    }

    function formatNumber(num) {
      if (!num) return '0';
      const n = Number(num);
      if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
      if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
      return n.toString();
    }

    async function fetchWithFallback(urlFn) {
      while (true) {
        const url = urlFn(getApiKey());
        const res = await fetch(url);
        const data = await res.json();

        if (data.error && (data.error.code === 403 || data.error.code === 429)) {
          if (nextApiKey()) {
            continue;
          } else {
            throw new Error('All API Keys exhausted');
          }
        }
        return data;
      }
    }

    async function processStream(stream) {
      try {
        const videoUrl = stream.channel_id;
        if (!videoUrl) return;

        const handleMatch = videoUrl.match(/@([a-zA-Z0-9_-]+)/);
        const channelIdMatchUrl = videoUrl.match(/channel\/(UC[a-zA-Z0-9_-]+)/);
        const rawChannelIdMatch = videoUrl.match(/^(UC[a-zA-Z0-9_-]{22})$/);

        let channelId = null;
        if (rawChannelIdMatch) channelId = rawChannelIdMatch[1];
        else if (channelIdMatchUrl) channelId = channelIdMatchUrl[1];

        let uploadsPlaylistId = null;
        let channelAvatar = '';

        if (handleMatch && !channelId) {
          const handleData = await fetchWithFallback(key => `https://youtube.googleapis.com/youtube/v3/channels?part=id,contentDetails,snippet&forHandle=@${handleMatch[1]}&key=${key}`);
          if (handleData.items && handleData.items.length > 0) {
            channelId = handleData.items[0].id;
            uploadsPlaylistId = handleData.items[0].contentDetails?.relatedPlaylists?.uploads;
            channelAvatar = handleData.items[0].snippet?.thumbnails?.default?.url || '';
          }
        } else if (channelId) {
          const idData = await fetchWithFallback(key => `https://youtube.googleapis.com/youtube/v3/channels?part=contentDetails,snippet&id=${channelId}&key=${key}`);
          if (idData.items && idData.items.length > 0) {
            uploadsPlaylistId = idData.items[0].contentDetails?.relatedPlaylists?.uploads;
            channelAvatar = idData.items[0].snippet?.thumbnails?.default?.url || '';
          }
        }

        if (!uploadsPlaylistId) return;

        const playlistData = await fetchWithFallback(key => `https://youtube.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=3&key=${key}`);
        if (!playlistData.items || playlistData.items.length === 0) return;

        const videoIds = playlistData.items.map(i => i.snippet.resourceId.videoId).join(',');
        const videosData = await fetchWithFallback(key => `https://youtube.googleapis.com/youtube/v3/videos?part=snippet,liveStreamingDetails,statistics&id=${videoIds}&key=${key}`);
        if (!videosData.items || videosData.items.length === 0) return;

        let activeVideo = videosData.items.find(v => v.liveStreamingDetails && v.liveStreamingDetails.concurrentViewers);
        let isLive = !!activeVideo;

        if (!activeVideo) {
          activeVideo = videosData.items.find(v => v.liveStreamingDetails);
        }

        if (!activeVideo) return;

        let uptimeString = 'Offline';
        let viewers = '0';

        if (isLive) {
          const start = new Date(activeVideo.liveStreamingDetails.actualStartTime);
          const now = new Date();
          const diffMs = now.getTime() - start.getTime();
          const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
          const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          uptimeString = diffHrs > 0 ? `${diffHrs}h ${diffMins}m` : `${diffMins} min`;
          viewers = formatNumber(activeVideo.liveStreamingDetails.concurrentViewers);
        } else {
          if (activeVideo.statistics?.viewCount) {
            viewers = formatNumber(activeVideo.statistics.viewCount);
          }
          if (activeVideo.liveStreamingDetails?.actualEndTime) {
             const ended = new Date(activeVideo.liveStreamingDetails.actualEndTime);
             uptimeString = `Selesai ${ended.toLocaleDateString()}`;
          } else if (activeVideo.snippet?.publishedAt) {
             const published = new Date(activeVideo.snippet.publishedAt);
             uptimeString = `Selesai ${published.toLocaleDateString()}`;
          }
        }

        const payload = {
          yt_title: activeVideo.snippet.title,
          yt_channel_name: activeVideo.snippet.channelTitle,
          yt_thumbnail_url: activeVideo.snippet.thumbnails?.maxres?.url || activeVideo.snippet.thumbnails?.high?.url || '',
          yt_channel_avatar: channelAvatar,
          yt_viewers: viewers,
          yt_uptime: uptimeString,
          yt_video_id: activeVideo.id,
          yt_is_live: isLive,
          yt_last_updated: new Date().toISOString()
        };

        const { error } = await supabase.from('streams').update(payload).eq('id', stream.id);
        if (error) console.error(`DB Update Error for ${stream.nama}:`, error.message);

      } catch (error) {
        console.error(`Process Error for ${stream.nama}:`, error.message);
      }
    }

    // Ambil data
    const { data: streams, error } = await supabase.from('streams').select('*');
    if (error) {
      return response.status(500).json({ error: error.message });
    }

    // Jalankan semua (dengan sedikit delay antar request)
    for (const stream of streams) {
      await processStream(stream);
      await new Promise(res => setTimeout(res, 300));
    }

    return response.status(200).json({ success: true, message: `Synced ${streams.length} channels` });

  } catch (error) {
    return response.status(500).json({ error: error.message });
  }
}
