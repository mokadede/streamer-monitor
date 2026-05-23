export interface StreamData {
  id: string;
  url: string; // Wajib diisi dengan link YouTube
  avatarUrl?: string; // Optional
  grup?: string; // Menyimpan nama grup (misal: 'AAA', 'B2F')
  yt_title?: string;
  yt_channel_name?: string;
  yt_thumbnail_url?: string;
  yt_channel_avatar?: string;
  yt_viewers?: string;
  yt_uptime?: string;
  yt_video_id?: string;
  yt_is_live?: boolean;
  yt_last_updated?: string;
}
