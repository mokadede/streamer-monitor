import { useEffect } from 'react';
import { Eye, Clock } from 'lucide-react';
import type { StreamData } from '../types';

export default function StreamCard({
  stream,
  accent,
  onLiveStatusChange
}: {
  stream: StreamData;
  accent: string;
  onLiveStatusChange?: (id: string, status: 'LIVE' | 'VOD' | 'OFFLINE') => void;
}) {
  const loading = false;
  const ytData = stream.yt_video_id ? {
    title: stream.yt_title,
    channelName: stream.yt_channel_name,
    thumbnailUrl: stream.yt_thumbnail_url,
    viewers: stream.yt_viewers,
    uptime: stream.yt_uptime,
    channelAvatar: stream.yt_channel_avatar,
    videoUrl: `https://www.youtube.com/watch?v=${stream.yt_video_id}`,
    isLive: stream.yt_is_live
  } : null;

  useEffect(() => {
    if (!loading) {
      if (!ytData) {
        onLiveStatusChange?.(stream.id, 'OFFLINE');
      } else if (ytData.isLive) {
        onLiveStatusChange?.(stream.id, 'LIVE');
      } else {
        onLiveStatusChange?.(stream.id, 'VOD');
      }
    }
  }, [loading, ytData, stream.id, onLiveStatusChange]);

  if (!loading && !ytData) {
    return null;
  }

  const displayTitle = ytData?.title || 'Memuat data...';
  const displayChannel = ytData?.channelName || 'Memuat channel...';
  const displayThumbnail = ytData?.thumbnailUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=640&h=360';
  const displayViewers = ytData?.viewers || '0';
  const displayUptime = ytData?.uptime || '...';
  const displayAvatar = ytData?.channelAvatar || stream.avatarUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(displayChannel) + '&background=random';

  return (
    <div
      style={{
        borderRadius: 16,
        overflow: 'hidden',
        background: '#141418',
        border: '1px solid rgba(255,255,255,0.06)',
        cursor: 'pointer',
        transition: 'transform 350ms cubic-bezier(.4,0,.2,1), box-shadow 350ms cubic-bezier(.4,0,.2,1), border-color 350ms',
        opacity: loading ? 0.6 : 1,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-6px)';
        e.currentTarget.style.boxShadow = `0 24px 48px -12px ${accent}25`;
        e.currentTarget.style.borderColor = `${accent}30`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
      }}
      onClick={() => {
        const targetUrl = ytData?.videoUrl || stream.url;
        if (targetUrl) {
          window.open(targetUrl, '_blank');
        }
      }}
    >
      <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden', background: '#000' }}>
        <img
          src={displayThumbnail}
          alt={displayTitle}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 600ms cubic-bezier(.4,0,.2,1), opacity 300ms',
            opacity: 0.9,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.opacity = '1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.opacity = '0.9';
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '50%',
            background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            background: ytData?.isLive ? 'rgba(220,38,38,0.92)' : 'rgba(75,85,99,0.92)',
            backdropFilter: 'blur(8px)',
            padding: '4px 10px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 800,
            color: '#fff',
            letterSpacing: '0.06em',
          }}
        >
          {ytData?.isLive && (
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#fff',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
          )}
          {ytData?.isLive ? 'LIVE' : 'VOD'}
        </div>
        <div style={{ position: 'absolute', bottom: 10, right: 12, display: 'flex', gap: 8 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(8px)',
              padding: '3px 8px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 700,
              color: '#e5e7eb',
            }}
          >
            <Eye size={12} />
            {displayViewers}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(8px)',
              padding: '3px 8px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 700,
              color: '#e5e7eb',
            }}
          >
            <Clock size={12} />
            {displayUptime}
          </div>
        </div>
      </div>
      <div style={{ padding: '16px 18px 20px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <img
          src={displayAvatar}
          alt={displayChannel}
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            objectFit: 'cover',
            border: '2px solid rgba(255,255,255,0.08)',
            flexShrink: 0,
          }}
        />
        <div style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
          <h3
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: '#f3f4f6',
              lineHeight: 1.4,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              margin: 0,
            }}
            title={displayTitle}
          >
            {displayTitle}
          </h3>
          <p
            style={{
              fontSize: 13,
              color: '#6b7280',
              margin: '4px 0 0',
              fontWeight: 500,
            }}
          >
            {displayChannel}
          </p>
        </div>
      </div>
    </div>
  );
}
