import { useState, useEffect } from 'react';

// Note: To fetch the actual video category (game name), we'd need another API call.
// For simplicity, we just use a generic 'YouTube Live' tag, or the original game from mock if available.
export interface YouTubeStreamData {
  title: string;
  channelName: string;
  thumbnailUrl: string;
  channelAvatar?: string;
  viewers: string;
  uptime: string;
  videoUrl?: string;
  isLive: boolean; // Menandakan apakah ini benar-benar live atau VOD (rekaman)
}

export function useYouTubeStream(videoUrl?: string) {
  const [data, setData] = useState<YouTubeStreamData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!videoUrl) return;

    let isMounted = true;
    setLoading(true);

    const fetchData = async () => {
      try {
        const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
        let finalVideoId = null;

        // 1. Cek apakah ini URL Channel / Handle / ID Asli (mengandung @ atau UC)
        const handleMatch = videoUrl.match(/@([a-zA-Z0-9_-]+)/);
        const channelIdMatchUrl = videoUrl.match(/channel\/(UC[a-zA-Z0-9_-]+)/);
        const rawChannelIdMatch = videoUrl.match(/^(UC[a-zA-Z0-9_-]{22})$/); // ID asli YouTube (24 karakter)

        if (handleMatch || channelIdMatchUrl || rawChannelIdMatch) {
          let channelId = null;
          if (rawChannelIdMatch) channelId = rawChannelIdMatch[1];
          else if (channelIdMatchUrl) channelId = channelIdMatchUrl[1];

          // Jika berupa handle (@nopalwi), cari channel ID nya dulu
          let uploadsPlaylistId = null;

          if (handleMatch && !channelId) {
            const handleRes = await fetch(
              `https://youtube.googleapis.com/youtube/v3/channels?part=id,contentDetails&forHandle=@${handleMatch[1]}&key=${apiKey}`
            );
            const handleResult = await handleRes.json();
            if (handleResult.items && handleResult.items.length > 0) {
              channelId = handleResult.items[0].id;
              uploadsPlaylistId = handleResult.items[0].contentDetails?.relatedPlaylists?.uploads;
            }
          } else if (channelId) {
            const idRes = await fetch(
              `https://youtube.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${apiKey}`
            );
            const idResult = await idRes.json();
            if (idResult.items && idResult.items.length > 0) {
              uploadsPlaylistId = idResult.items[0].contentDetails?.relatedPlaylists?.uploads;
            }
          }

          if (uploadsPlaylistId) {
            // 2. Ambil 3 video terbaru dari playlist uploads (Hanya biaya 1 point, dibanding search 100 point)
            const playlistRes = await fetch(
              `https://youtube.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=3&key=${apiKey}`
            );
            const playlistResult = await playlistRes.json();

            if (playlistResult.items && playlistResult.items.length > 0) {
              const videoIds = playlistResult.items.map((i: any) => i.snippet.resourceId.videoId).join(',');
              
              // Cek mana yang live/VOD
              const videosRes = await fetch(
                `https://youtube.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${videoIds}&key=${apiKey}`
              );
              const videosResult = await videosRes.json();

              if (videosResult.items && videosResult.items.length > 0) {
                // Prioritas 1: Yang sedang live
                let activeVideo = videosResult.items.find((v: any) => v.liveStreamingDetails && v.liveStreamingDetails.concurrentViewers);
                
                // Prioritas 2: Jika tidak ada, ambil VOD pertama (karena sudah diurut dari yang terbaru)
                if (!activeVideo) {
                  activeVideo = videosResult.items.find((v: any) => v.liveStreamingDetails);
                }

                if (activeVideo) {
                  finalVideoId = activeVideo.id;
                } else {
                  if (isMounted) setData(null);
                  return;
                }
              }
            } else {
              if (isMounted) setData(null);
              return;
            }
          }
        } else {
          // 2. Jika ini adalah URL Video biasa (mengandung v=)
          const videoMatch = videoUrl.match(/(?:v=|\/)([0-9A-Za-z_-]{11}).*/);
          finalVideoId = videoMatch ? videoMatch[1] : null;
        }

        if (!finalVideoId) return;

        // 3. Ambil detail statistik video seperti biasa
        const res = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=snippet,liveStreamingDetails,statistics&id=${finalVideoId}&key=${apiKey}`
        );
        const result = await res.json();
        const item = result.items?.[0];

        if (item && isMounted) {
          // 4. Ambil Avatar Asli dari Channel
          let channelAvatar = '';
          if (item.snippet?.channelId) {
            try {
              const channelRes = await fetch(
                `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${item.snippet.channelId}&key=${apiKey}`
              );
              const channelData = await channelRes.json();
              channelAvatar = channelData.items?.[0]?.snippet?.thumbnails?.default?.url || '';
            } catch (e) {
              console.error('Gagal mengambil avatar channel', e);
            }
          }

          let uptimeString = 'Offline';
          let viewers = '0';
          let isLive = false;

          // If currently live
          if (item.liveStreamingDetails && item.liveStreamingDetails.concurrentViewers) {
            isLive = true;
            const start = new Date(item.liveStreamingDetails.actualStartTime);
            const now = new Date();
            const diffMs = now.getTime() - start.getTime();
            const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
            const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            
            uptimeString = diffHrs > 0 ? `${diffHrs}h ${diffMins}m` : `${diffMins} min`;
            viewers = formatNumber(item.liveStreamingDetails.concurrentViewers);
          } else {
            // Fallback for VODs / Offline videos (Berguna jika yang dimasukkan URL video spesifik atau pencarian fallback di atas)
            if (item.statistics?.viewCount) {
              viewers = formatNumber(item.statistics.viewCount);
            }
            if (item.liveStreamingDetails?.actualEndTime) {
               const ended = new Date(item.liveStreamingDetails.actualEndTime);
               uptimeString = `Selesai ${ended.toLocaleDateString()}`;
            } else if (item.snippet?.publishedAt) {
               const published = new Date(item.snippet.publishedAt);
               uptimeString = `Selesai ${published.toLocaleDateString()}`;
            }
          }

          setData({
            title: item.snippet.title,
            channelName: item.snippet.channelTitle,
            thumbnailUrl: item.snippet.thumbnails.maxres?.url || item.snippet.thumbnails.high?.url || '',
            channelAvatar,
            viewers,
            uptime: uptimeString,
            videoUrl: `https://www.youtube.com/watch?v=${finalVideoId}`,
            isLive,
          });
        }
      } catch (error) {
        console.error('Failed to fetch YouTube data', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [videoUrl]);

  return { data, loading };
}

function formatNumber(numStr: string) {
  const num = parseInt(numStr, 10);
  if (isNaN(num)) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}
