import { fetchWithFallback, formatNumber } from './youtube.js';
import { supabase } from './supabase.js';

export async function processStream(stream) {
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

    // Prioritas 1: Cari video yang status broadcast-nya BENAR-BENAR 'live'
    let activeVideo = videosData.items.find(v => v.snippet?.liveBroadcastContent === 'live');
    let isLive = !!activeVideo;

    // Prioritas 2: Jika tidak ada yang live, cari VOD terbaru
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
