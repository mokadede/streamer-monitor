import { useState, useCallback } from 'react';
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
