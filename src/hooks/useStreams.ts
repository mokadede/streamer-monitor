import { useState, useEffect } from 'react';
import type { StreamData } from '../types';

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
          }));
          setStreams(mappedStreams);
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
