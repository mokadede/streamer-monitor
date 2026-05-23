import { fetchWithFallback, formatNumber } from './youtube.js';
import { supabase } from './supabase.js';

/**
 * Mendapatkan uploadsPlaylistId untuk sebuah channel.
 *
 * STRATEGI CACHING 2 LEVEL:
 * Level 1 (DB Cache): Jika `yt_uploads_id` sudah tersimpan di DB, langsung
 *   pakai tanpa hit YouTube /channels endpoint sama sekali. Ini menghemat
 *   1 unit quota per streamer per sync cycle.
 * Level 2 (API Fetch): Jika belum ada, baru fetch dari YouTube dan simpan
 *   hasilnya ke DB untuk dipakai di siklus berikutnya.
 */
async function getUploadsPlaylistId(stream, videoUrl) {
  // Level 1: Baca dari DB cache terlebih dahulu
  if (stream.yt_uploads_id) {
    console.log(`[DB Cache HIT] uploads_id for: ${stream.nama}`);
    return { uploadsPlaylistId: stream.yt_uploads_id, channelAvatar: stream.yt_channel_avatar || '' };
  }

  // Level 2: Fetch dari YouTube API
  console.log(`[DB Cache MISS] Fetching uploads_id from YouTube for: ${stream.nama}`);

  const handleMatch = videoUrl.match(/@([a-zA-Z0-9_-]+)/);
  const channelIdMatchUrl = videoUrl.match(/channel\/(UC[a-zA-Z0-9_-]+)/);
  const rawChannelIdMatch = videoUrl.match(/^(UC[a-zA-Z0-9_-]{22})$/);

  let channelId = null;
  if (rawChannelIdMatch) channelId = rawChannelIdMatch[1];
  else if (channelIdMatchUrl) channelId = channelIdMatchUrl[1];

  let uploadsPlaylistId = null;
  let channelAvatar = '';

  if (handleMatch && !channelId) {
    const handleData = await fetchWithFallback(
      key => `https://youtube.googleapis.com/youtube/v3/channels?part=id,contentDetails,snippet&forHandle=@${handleMatch[1]}&key=${key}`
    );
    if (handleData.items && handleData.items.length > 0) {
      channelId = handleData.items[0].id;
      uploadsPlaylistId = handleData.items[0].contentDetails?.relatedPlaylists?.uploads;
      channelAvatar = handleData.items[0].snippet?.thumbnails?.default?.url || '';
    }
  } else if (channelId) {
    const idData = await fetchWithFallback(
      key => `https://youtube.googleapis.com/youtube/v3/channels?part=contentDetails,snippet&id=${channelId}&key=${key}`
    );
    if (idData.items && idData.items.length > 0) {
      uploadsPlaylistId = idData.items[0].contentDetails?.relatedPlaylists?.uploads;
      channelAvatar = idData.items[0].snippet?.thumbnails?.default?.url || '';
    }
  }

  // Simpan uploadsPlaylistId ke DB agar siklus berikutnya tidak perlu fetch ulang
  if (uploadsPlaylistId) {
    const { error } = await supabase
      .from('streams')
      .update({ yt_uploads_id: uploadsPlaylistId })
      .eq('id', stream.id);
    if (error) {
      console.error(`[DB Cache] Failed to save yt_uploads_id for ${stream.nama}:`, error.message);
    } else {
      console.log(`[DB Cache SAVED] yt_uploads_id for ${stream.nama}: ${uploadsPlaylistId}`);
    }
  }

  return { uploadsPlaylistId, channelAvatar };
}

export async function processStream(stream) {
  try {
    const videoUrl = stream.channel_id;
    if (!videoUrl) return;

    // Ambil uploadsPlaylistId dengan sistem caching 2 level
    const { uploadsPlaylistId, channelAvatar } = await getUploadsPlaylistId(stream, videoUrl);
    if (!uploadsPlaylistId) return;

    // Fetch video terbaru dari uploads playlist
    const playlistData = await fetchWithFallback(
      key => `https://youtube.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=3&key=${key}`
    );
    if (!playlistData.items || playlistData.items.length === 0) return;

    const videoIds = playlistData.items.map(i => i.snippet.resourceId.videoId).join(',');
    const videosData = await fetchWithFallback(
      key => `https://youtube.googleapis.com/youtube/v3/videos?part=snippet,liveStreamingDetails,statistics&id=${videoIds}&key=${key}`
    );
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
    let endedAt = null;

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
        endedAt = ended.toISOString();
        uptimeString = `Selesai ${ended.toLocaleDateString()}`;
      } else if (activeVideo.snippet?.publishedAt) {
        const published = new Date(activeVideo.snippet.publishedAt);
        endedAt = published.toISOString();
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
      yt_ended_at: isLive ? null : endedAt, // null saat live, ISO timestamp saat VOD
      yt_last_updated: new Date().toISOString(),
    };

    const { error } = await supabase.from('streams').update(payload).eq('id', stream.id);
    if (error) console.error(`DB Update Error for ${stream.nama}:`, error.message);

  } catch (error) {
    console.error(`Process Error for ${stream.nama}:`, error.message);
  }
}
