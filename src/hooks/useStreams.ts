import { useState, useEffect } from 'react';
import type { StreamData } from '../types';

const VOD_MAX_AGE_HOURS = 24;

/**
 * Menentukan apakah sebuah VOD masih layak ditampilkan.
 * - Jika stream sedang LIVE → selalu tampil.
 * - Jika VOD dan yt_ended_at belum diisi → tampil (data lama, belum di-sync).
 * - Jika VOD dan yt_ended_at sudah > 24 jam yang lalu → TIDAK ditampilkan.
 */
function isStreamVisible(stream: StreamData): boolean {
  if (stream.yt_is_live) return true;

  if (!stream.yt_ended_at) return true; // data lama sebelum kolom yt_ended_at ada

  const endedAt = new Date(stream.yt_ended_at).getTime();
  const ageMs = Date.now() - endedAt;
  const ageLimitMs = VOD_MAX_AGE_HOURS * 60 * 60 * 1000;

  return ageMs <= ageLimitMs;
}

export function useStreams() {
  const [streams, setStreams] = useState<StreamData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStreams = async () => {
      try {
        const response = await fetch('/api/streams');
        if (!response.ok) {
          throw new Error('Failed to fetch streams');
        }
        const data = await response.json();

        if (data) {
          const mappedStreams: StreamData[] = data.map((item: any) => ({
            id: item.id,
            url: item.channel_id,
            grup: item.grup,
            yt_title: item.yt_title,
            yt_channel_name: item.yt_channel_name,
            yt_thumbnail_url: item.yt_thumbnail_url,
            yt_channel_avatar: item.yt_channel_avatar,
            yt_viewers: item.yt_viewers,
            yt_uptime: item.yt_uptime,
            yt_video_id: item.yt_video_id,
            yt_is_live: item.yt_is_live,
            yt_last_updated: item.yt_last_updated,
            yt_ended_at: item.yt_ended_at,
          }));

          // Hanya tampilkan stream yang LIVE atau VOD yang masih < 24 jam
          const visibleStreams = mappedStreams.filter(isStreamVisible);
          setStreams(visibleStreams);
        }
      } catch (err: any) {
        setError(err.message || 'Unknown error');
        console.error('Error fetching streams:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStreams();
  }, []);

  return { streams, loading, error };
}
