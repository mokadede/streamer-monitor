import { useState } from 'react';
import { ArrowUp, Radio, Clock } from 'lucide-react';
import type { StreamData } from './types';
import StreamCard from './components/StreamCard';

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
  const [filter, setFilter] = useState<'all' | 'live' | 'vod'>('all');

  const totalLive = streams.filter(s => s.yt_video_id && s.yt_is_live).length;
  const totalVod = streams.filter(s => s.yt_video_id && !s.yt_is_live).length;

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

            {/* Stats pills — klik untuk filter */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setFilter(prev => prev === 'live' ? 'all' : 'live')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 16px',
                  borderRadius: 999,
                  background: filter === 'live' ? 'rgba(239,68,68,0.35)' : 'rgba(239,68,68,0.12)',
                  border: filter === 'live' ? '1.5px solid rgba(239,68,68,0.7)' : '1px solid rgba(239,68,68,0.25)',
                  cursor: 'pointer',
                  transition: 'all 200ms ease',
                  transform: filter === 'live' ? 'scale(1.05)' : 'scale(1)',
                }}
              >
                <Radio size={14} color="#ef4444" className="animate-pulse" />
                <span style={{ fontSize: 13, fontWeight: 700, color: filter === 'live' ? '#fff' : '#fca5a5' }}>
                  {totalLive} Live
                </span>
              </button>

              {/* VOD Filter */}
              <button
                onClick={() => setFilter(prev => prev === 'vod' ? 'all' : 'vod')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 16px',
                  borderRadius: 999,
                  background: filter === 'vod' ? 'rgba(75,85,99,0.45)' : 'rgba(75,85,99,0.2)',
                  border: filter === 'vod' ? '1.5px solid rgba(156,163,175,0.6)' : '1px solid rgba(75,85,99,0.3)',
                  cursor: 'pointer',
                  transition: 'all 200ms ease',
                  transform: filter === 'vod' ? 'scale(1.05)' : 'scale(1)',
                }}
              >
                <Clock size={14} color={filter === 'vod' ? '#e5e7eb' : '#9ca3af'} />
                <span style={{ fontSize: 13, fontWeight: 700, color: filter === 'vod' ? '#fff' : '#d1d5db' }}>
                  {totalVod} VOD
                </span>
              </button>

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
          {(() => {
            const filteredStreams = streams.filter((stream) => {
              if (filter === 'all') return true;
              const isLive = stream.yt_video_id && stream.yt_is_live;
              const isVod = stream.yt_video_id && !stream.yt_is_live;
              if (filter === 'live') return !!isLive;
              if (filter === 'vod') return !!isVod;
              return true;
            });

            if (streams.length === 0) {
              return (
                <div className="col-span-full py-20 text-center text-gray-500 font-medium">
                  Tidak ada data terbaru...
                </div>
              );
            }

            if (filteredStreams.length === 0 && filter !== 'all') {
              return (
                <div className="col-span-full py-20 text-center text-gray-500 font-medium">
                  Tidak ada streamer yang {filter === 'live' ? 'sedang LIVE' : 'memiliki VOD terbaru'} saat ini.
                </div>
              );
            }

            return filteredStreams.map((stream) => (
              <StreamCard
                key={stream.id}
                stream={stream}
                accent={color}
              />
            ));
          })()}
        </div>
      </div>
    </section>
  );
}
