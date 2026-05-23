import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import GroupPage, { type StreamData } from './GroupPage';
import { supabase } from './lib/supabase';
import b2fLogo from './assets/images/b2f.png';
import o2hLogo from './assets/images/o2h.png';
import aaLogo from './assets/images/aaa.png';

/* ─── Image Data ───────────────────────────────────────────── */
const IMAGES = [
  {
    src: b2fLogo,
    bg: '#F5A623',
    panel: '#F7B84E',
    aspect: '1 / 1',
    centerScale: { desktop: 0.75, mobile: 0.71 },
    text: 'B2F',
    route: '/b2f',
  },
  {
    src: aaLogo,
    bg: '#E882B4',
    panel: '#ED9DC4',
    aspect: '1/1',
    centerScale: { desktop: 0.85, mobile: 1 },
    text: 'AAA CLAN',
    route: '/aaa',
  },
  {
    src: o2hLogo,
    bg: '#10B981',
    panel: '#34D399',
    aspect: '1 / 1',
    centerScale: { desktop: 0.85, mobile: 0.98 },
    text: 'O2H',
    route: '/o2h',
  },
];

/* ─── Grain Overlay SVG (fractalNoise) ─────────────────────── */
const GRAIN_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23grain)' opacity='0.08'/%3E%3C/svg%3E")`;

/* ─── Easing ───────────────────────────────────────────────── */
const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';
const DURATION = 650; // ms

/* ─── Role helpers ─────────────────────────────────────────── */
type Role = 'center' | 'left' | 'right' | 'back';

function getRole(index: number, activeIndex: number): Role {
  if (index === activeIndex) return 'center';
  if (index === (activeIndex + 2) % 3) return 'left';
  if (index === (activeIndex + 1) % 3) return 'right';
  return 'back';
}

function getRoleStyle(
  role: Role,
  isMobile: boolean,
  overrides?: { aspect?: string; centerScale?: { desktop: number; mobile: number } },
): React.CSSProperties {
  const transition = [
    `transform ${DURATION}ms ${EASE}`,
    `filter ${DURATION}ms ${EASE}`,
    `opacity ${DURATION}ms ${EASE}`,
    `left ${DURATION}ms ${EASE}`,
    `bottom ${DURATION}ms ${EASE}`,
    `height ${DURATION}ms ${EASE}`,
  ].join(', ');

  const base: React.CSSProperties = {
    position: 'absolute',
    aspectRatio: overrides?.aspect ?? '0.6 / 1',
    transition,
    willChange: 'transform, filter, opacity',
  };

  const cScaleDesktop = overrides?.centerScale?.desktop ?? 1.68;
  const cScaleMobile = overrides?.centerScale?.mobile ?? 1.25;

  switch (role) {
    case 'center':
      return {
        ...base,
        transform: `translateX(-50%) scale(${isMobile ? cScaleMobile : cScaleDesktop})`,
        filter: 'drop-shadow(0px 25px 40px rgba(0,0,0,0.3)) blur(0px)',
        opacity: 1,
        zIndex: 20,
        left: '50%',
        height: isMobile ? '60%' : '92%',
        bottom: isMobile ? '22%' : '0',
      };
    case 'left':
      return {
        ...base,
        transform: 'translateX(-50%) scale(1)',
        filter: 'blur(2px)',
        opacity: 0.85,
        zIndex: 10,
        left: isMobile ? '20%' : '30%',
        height: isMobile ? '16%' : '28%',
        bottom: isMobile ? '32%' : '12%',
      };
    case 'right':
      return {
        ...base,
        transform: 'translateX(-50%) scale(1)',
        filter: 'blur(2px)',
        opacity: 0.85,
        zIndex: 10,
        left: isMobile ? '80%' : '70%',
        height: isMobile ? '16%' : '28%',
        bottom: isMobile ? '32%' : '12%',
      };
    case 'back':
      return {
        ...base,
        transform: 'translateX(-50%) scale(1)',
        filter: 'blur(4px)',
        opacity: 1,
        zIndex: 5,
        left: '50%',
        height: isMobile ? '13%' : '22%',
        bottom: isMobile ? '32%' : '12%',
      };
  }
}

/* ─── Component ────────────────────────────────────────────── */
export default function App() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showDiscover, setShowDiscover] = useState(false);
  const [supabaseStreams, setSupabaseStreams] = useState<StreamData[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Fetch Supabase Data */
  useEffect(() => {
    const fetchStreams = async () => {
      const { data, error } = await supabase
        .from('streams')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return;
      }

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
        setSupabaseStreams(mappedStreams);
      }
    };

    fetchStreams();
  }, []);

  /* Preload images */
  useEffect(() => {
    IMAGES.forEach(({ src }) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  /* Responsive check */
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  /* Cleanup timer */
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  /* Navigate */
  const navigate = useCallback(
    (direction: 'next' | 'prev') => {
      if (isAnimating) return;
      setIsAnimating(true);
      setActiveIndex((prev) =>
        direction === 'next' ? (prev + 1) % 3 : (prev + 2) % 3,
      );
      timerRef.current = setTimeout(() => setIsAnimating(false), DURATION);
    },
    [isAnimating],
  );

  return (
    <div className="w-full h-[100dvh] overflow-hidden relative">
      <div
        className="w-full h-[200dvh] flex flex-col transition-transform duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{ transform: showDiscover ? 'translateY(-100dvh)' : 'translateY(0)' }}
      >
        {/* 1 ─ Viewport container: Carousel (100dvh) */}
        <div
          style={{
            backgroundColor: IMAGES[activeIndex].bg,
            transition: `background-color ${DURATION}ms ${EASE}`,
            fontFamily: "'Inter', sans-serif",
            height: '100dvh',
            width: '100vw',
          }}
          className="relative overflow-hidden shrink-0"
        >

          {/* 1 ─ Grain overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              zIndex: 50,
              opacity: 0.4,
              backgroundImage: GRAIN_SVG,
              backgroundSize: '200px 200px',
              backgroundRepeat: 'repeat',
            }}
          />

          {/* 2 ─ Giant ghost text (BEHIND logo) */}
          <div
            className="absolute inset-x-0 flex items-center justify-center pointer-events-none select-none"
            style={{ zIndex: 2, top: '27%' }}
          >
            {IMAGES.map((item, index) => (
              <span
                key={`back-${index}`}
                style={{
                  position: 'absolute',
                  fontFamily: "'Anton', sans-serif",
                  fontSize: 'clamp(90px, 28vw, 380px)',
                  fontWeight: 900,
                  color: 'white',
                  textShadow: '0px 9px 40px rgba(0, 0, 0, 0.15)',
                  opacity: index === activeIndex ? 1 : 0,
                  transition: `opacity ${DURATION}ms ${EASE}`,
                  lineHeight: 1,
                  textTransform: 'uppercase',
                  letterSpacing: '-0.02em',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.text}
              </span>
            ))}
          </div>

          {/* 3 ─ Top-left brand label */}
          {/* <div
          className="absolute top-6 left-4 sm:left-8"
          style={{ zIndex: 60 }}
        >
          <span
            className="text-xs font-semibold uppercase"
            style={{
              color: 'white',
              opacity: 0.9,
              letterSpacing: '0.18em',
            }}
          >
            TOONHUB
          </span>
        </div> */}

          {/* 4 ─ Carousel */}
          <div className="absolute inset-0" style={{ zIndex: 3 }}>
            {IMAGES.map((item, index) => {
              const role = getRole(index, activeIndex);
              const style = getRoleStyle(role, isMobile, {
                aspect: 'aspect' in item ? (item as any).aspect : undefined,
                centerScale: 'centerScale' in item ? (item as any).centerScale : undefined,
              });

              return (
                <div key={index} style={style}>
                  <img
                    src={item.src}
                    alt={`Figurine ${index + 1}`}
                    draggable={false}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      objectPosition: 'bottom center',
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* 4.5 ─ Giant ghost text outline (IN FRONT of logo) */}
          <div
            className="absolute inset-x-0 flex items-center justify-center pointer-events-none select-none"
            style={{ zIndex: 4, top: '27%' }}
          >
            {IMAGES.map((item, index) => (
              <span
                key={`front-${index}`}
                style={{
                  position: 'absolute',
                  fontFamily: "'Anton', sans-serif",
                  fontSize: 'clamp(90px, 28vw, 380px)',
                  fontWeight: 900,
                  color: 'transparent',
                  WebkitTextStroke: '1.5px rgba(255, 255, 255, 0.6)',
                  opacity: index === activeIndex ? 1 : 0,
                  transition: `opacity ${DURATION}ms ${EASE}`,
                  lineHeight: 1,
                  textTransform: 'uppercase',
                  letterSpacing: '-0.02em',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.text}
              </span>
            ))}
          </div>

          {/* 5 ─ Bottom-left text + nav buttons */}
          <div
            className="absolute bottom-10 left-4 sm:bottom-20 sm:left-24"
            style={{ zIndex: 60, maxWidth: 320 }}
          >
            {/* <p
              className="mb-2 sm:mb-3 text-base sm:text-[22px]"
              style={{
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.02em',
                color: 'white',
                opacity: 0.95,
              }}
            >
              Live HUB
            </p>

            <p
              className="hidden sm:block text-xs sm:text-sm mb-4 sm:mb-5"
              style={{
                color: 'white',
                opacity: 0.85,
                lineHeight: 1.6,
              }}
            >
              The artwork is stunning, shipped fully prepared. The finish is a
              vision, the 3D craft is flawless. Many thanks! Wishing you the win.
              Order now.
            </p> */}

            <div className="flex items-center gap-3">
              <button
                id="nav-prev"
                onClick={() => navigate('prev')}
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center cursor-pointer"
                style={{
                  backgroundColor: 'transparent',
                  border: '2px solid white',
                  color: 'white',
                  transition: 'transform 150ms, background-color 150ms',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.08)';
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                aria-label="Previous figurine"
              >
                <ArrowLeft size={26} strokeWidth={2.25} />
              </button>

              <button
                id="nav-next"
                onClick={() => navigate('next')}
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center cursor-pointer"
                style={{
                  backgroundColor: 'transparent',
                  border: '2px solid white',
                  color: 'white',
                  transition: 'transform 150ms, background-color 150ms',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.08)';
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                aria-label="Next figurine"
              >
                <ArrowRight size={26} strokeWidth={2.25} />
              </button>
            </div>
          </div>

          {/* 6 ─ Bottom-right CTA */}
          <div className="absolute bottom-10 right-4 sm:bottom-20 sm:right-16 z-50">
            <button
              onClick={() => setShowDiscover(true)}
              className="flex items-center gap-3 sm:gap-4 hover:scale-105 transition-transform cursor-pointer"
              style={{
                fontFamily: "'Anton', sans-serif",
                fontSize: 'clamp(20px, 4vw, 56px)',
                fontWeight: 400,
                color: 'white',
                opacity: 0.95,
                letterSpacing: '-0.02em',
                lineHeight: 1,
                textTransform: 'uppercase',
                background: 'transparent',
                border: 'none',
                transition: 'opacity 200ms',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '0.95';
              }}
            >
              DISCOVER IT
              <ArrowRight className="w-5 h-5 sm:w-8 sm:h-8" strokeWidth={2.25} />
            </button>
          </div>
        </div>

        {/* 2 ─ Viewport container: Discover Section (100dvh) */}
        <div className="w-screen h-[100dvh] overflow-y-auto overflow-x-hidden relative shrink-0 bg-[#0a0a0c]">
          {showDiscover && (
            <GroupPage
              title={IMAGES[activeIndex].text}
              color={IMAGES[activeIndex].bg}
              streams={supabaseStreams.filter((stream) => {
                const dbGrup = (stream.grup || '').toLowerCase().trim();
                const appGrup = IMAGES[activeIndex].route.replace('/', '').toLowerCase().trim();
                return dbGrup === appGrup || dbGrup === IMAGES[activeIndex].text.toLowerCase().trim();
              })}
              onBack={() => setShowDiscover(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
