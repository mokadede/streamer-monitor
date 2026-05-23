import b2fLogo from '../assets/images/b2f.png';
import o2hLogo from '../assets/images/o2h.png';
import aaLogo from '../assets/images/aaa.png';

export const IMAGES = [
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

export const GRAIN_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23grain)' opacity='0.08'/%3E%3C/svg%3E")`;

export const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';
export const DURATION = 650; // ms
