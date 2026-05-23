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
    const fetchStreams = async (bypassCache = false) => {
      try {
        const url = bypassCache ? `/api/streams?t=${Date.now()}` : '/api/streams';
        const response = await fetch(url);
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

          // ── Opsi 1: Pemicu Sinkronisasi dari Sisi Klien ──
          // Jangan memicu jika ini sudah merupakan re-fetch dengan cache bypass
          if (!bypassCache) {
            let latestUpdatedMs = 0;
            mappedStreams.forEach((stream) => {
              if (stream.yt_last_updated) {
                const time = new Date(stream.yt_last_updated).getTime();
                if (time > latestUpdatedMs) {
                  latestUpdatedMs = time;
                }
              }
            });

            const now = Date.now();
            const fiveMinutes = 5 * 60 * 1000;
            const isStale = (now - latestUpdatedMs) > fiveMinutes;

            if (isStale) {
              console.log('[Sync Hook] Data sudah usang (> 5 menit). Memicu sinkronisasi latar belakang...');
              fetch('/api/sync')
                .then(res => res.json())
                .then(resData => {
                  console.log('[Sync Hook] Hasil sinkronisasi latar belakang:', resData);
                  // Ambil data terbaru langsung dari DB tanpa cache
                  fetchStreams(true);
                })
                .catch(err => console.error('[Sync Hook] Gagal memicu sinkronisasi latar belakang:', err));
            }
          }
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
