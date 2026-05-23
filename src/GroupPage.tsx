import { useState, useEffect, useCallback } from 'react';
import { ArrowUp, Radio, Eye, Clock } from 'lucide-react';

// Struktur data yang akan Anda simpan di Supabase
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

export default function GroupPage({
  title,
  color,
  streams = [], // Default ke array kosong, nanti diisi data dari Supabase
  onBack
}: {
  title: string;
  color: string;
  streams?: StreamData[];
  onBack?: () => void;
}) {
  const [liveStatus, setLiveStatus] = useState<Record<string, 'LIVE' | 'VOD' | 'OFFLINE'>>({});

  const handleLiveStatus = useCallback((id: string, status: 'LIVE' | 'VOD' | 'OFFLINE') => {
    setLiveStatus(prev => {
      if (prev[id] === status) return prev;
      return { ...prev, [id]: status };
    });
  }, []);

  const totalLive = Object.values(liveStatus).filter(s => s === 'LIVE').length;
  const totalVod = Object.values(liveStatus).filter(s => s === 'VOD').length;

  return (
    <section
      style={{
        '--accent': color,
        background: '#0a0a0c',
        fontFamily: "'Inter', sans-serif",
      } as React.CSSProperties}
    >
      {/* ── Ambient glow ─────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 900,
          height: 500,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${color}18 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '80px 32px 100px', position: 'relative' }}>
        {/* ── Header ─────────────────────────────────────────── */}
        <header style={{ marginBottom: 56 }}>
          {/* Back link */}
          <button
            onClick={onBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'none',
              border: 'none',
              color: '#6b7280',
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              marginBottom: 20,
              padding: 0,
              transition: 'color 200ms',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#6b7280')}
          >
            <ArrowUp size={14} strokeWidth={2.5} />
            Back to top
          </button>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
            {/* Title */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
              <h2
                style={{
                  fontFamily: "'Anton', sans-serif",
                  fontSize: 'clamp(32px, 5vw, 52px)',
                  fontWeight: 400,
                  color,
                  lineHeight: 1,
                  textTransform: 'uppercase',
                  letterSpacing: '-0.01em',
                  transition: 'color 700ms',
                }}
              >
                {title}
              </h2>
              <span
                style={{
                  fontSize: 'clamp(14px, 2vw, 18px)',
                  fontWeight: 600,
                  color: '#9ca3af',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                Currently Live
              </span>
            </div>

            {/* Stats pills */}
            <div style={{ display: 'flex', gap: 10 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 16px',
                  borderRadius: 999,
                  background: 'rgba(239,68,68,0.12)',
                  border: '1px solid rgba(239,68,68,0.25)',
                }}
              >
                <Radio size={14} color="#ef4444" className="animate-pulse" />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#fca5a5' }}>
                  {totalLive} Live
                </span>
              </div>

              {/* VOD Counter */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 16px',
                  borderRadius: 999,
                  background: 'rgba(75,85,99,0.2)',
                  border: '1px solid rgba(75,85,99,0.3)',
                }}
              >
                <Clock size={14} color="#9ca3af" />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#d1d5db' }}>
                  {totalVod} VOD
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 16px',
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600, color: '#6b7280' }}>
                  {streams.length} Channels
                </span>
              </div>
            </div>
          </div>

          {/* Subtle divider */}
          <div
            style={{
              marginTop: 28,
              height: 1,
              background: `linear-gradient(90deg, ${color}40, transparent 60%)`,
            }}
          />
        </header>

        {/* ── Grid ────────────────────────────────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: 28,
          }}
        >
          {streams.length === 0 ? (
            <div className="col-span-full py-20 text-center text-gray-500 font-medium">
              Tidak ada data terbaru...
            </div>
          ) : (
            streams.map((stream) => (
              <StreamCard
                key={stream.id}
                stream={stream}
                accent={color}
                onLiveStatusChange={handleLiveStatus}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
}

/* ── Stream Card ──────────────────────────────────────────── */
function StreamCard({
  stream,
  accent,
  onLiveStatusChange
}: {
  stream: StreamData;
  accent: string;
  onLiveStatusChange?: (id: string, status: 'LIVE' | 'VOD' | 'OFFLINE') => void;
}) {
  const loading = false; // Langsung siap karena data dari Supabase
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

  // Lapor status ke GroupPage (untuk counter)
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

  // Sembunyikan kartu sepenuhnya jika channel tersebut sedang offline
  if (!loading && !ytData) {
    return null;
  }

  // Jika data YouTube belum di-fetch atau gagal, gunakan fallback kosong
  const displayTitle = ytData?.title || 'Memuat data...';
  const displayChannel = ytData?.channelName || 'Memuat channel...';
  const displayThumbnail = ytData?.thumbnailUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=640&h=360';
  const displayViewers = ytData?.viewers || '0';
  const displayUptime = ytData?.uptime || '...';

  // Gunakan data dari YouTube API jika ada, jika tidak ada fallback ke UI-Avatars
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
        opacity: loading ? 0.6 : 1, // Feedback during load
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
      {/* Thumbnail */}
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

        {/* Bottom gradient overlay */}
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

        {/* LIVE / VOD badge */}
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

        {/* Bottom-right stats */}
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

      {/* Card body */}
      <div style={{ padding: '16px 18px 20px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        {/* Avatar */}
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

        {/* Text */}
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
