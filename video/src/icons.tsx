import React from 'react';
import {C} from './theme';

// Простые линейные иконки в одном стиле: толщина 3, скруглённые концы.
type P = {size?: number; color?: string; draw?: number};

const Svg: React.FC<P & {children: React.ReactNode}> = ({size = 72, color = C.text, children}) => (
	<svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke={color}
		strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
		{children}
	</svg>
);

export const IconChart: React.FC<P> = (p) => (
	<Svg {...p}><path d="M8 54h48" /><path d="M10 44l12-12 9 8 13-17 10 6" /><circle cx="54" cy="29" r="2.5" fill={p.color ?? C.text} /></Svg>
);
export const IconTarget: React.FC<P> = (p) => (
	<Svg {...p}><circle cx="32" cy="32" r="22" /><circle cx="32" cy="32" r="12" /><circle cx="32" cy="32" r="3" fill={p.color ?? C.text} /></Svg>
);
export const IconNews: React.FC<P> = (p) => (
	<Svg {...p}><rect x="10" y="12" width="44" height="40" rx="6" /><path d="M18 22h28M18 31h28M18 40h16" /></Svg>
);
export const IconCoins: React.FC<P> = (p) => (
	<Svg {...p}><ellipse cx="32" cy="18" rx="16" ry="6" /><path d="M16 18v10c0 3.3 7.2 6 16 6s16-2.7 16-6V18" /><path d="M16 28v10c0 3.3 7.2 6 16 6s16-2.7 16-6V28" /><path d="M16 38v8c0 3.3 7.2 6 16 6s16-2.7 16-6v-8" /></Svg>
);
export const IconAlert: React.FC<P> = (p) => (
	<Svg {...p}><path d="M32 10L56 52H8z" /><path d="M32 26v12" /><circle cx="32" cy="45" r="1.8" fill={p.color ?? C.text} /></Svg>
);
export const IconCrown: React.FC<P> = (p) => (
	<Svg {...p}><path d="M10 46L14 20l11 12 7-16 7 16 11-12 4 26z" /><path d="M12 54h40" /></Svg>
);
export const IconMug: React.FC<P> = (p) => (
	<Svg {...p}><path d="M12 18h32v24a10 10 0 0 1-10 10H22a10 10 0 0 1-10-10z" /><path d="M44 24h4a7 7 0 0 1 0 14h-4" /><path d="M20 8c0 3 3 3 3 6M30 8c0 3 3 3 3 6" /></Svg>
);
export const IconChat: React.FC<P> = (p) => (
	<Svg {...p}><path d="M12 14h40v28H28l-10 8v-8h-6z" /><path d="M22 25h20M22 32h12" /></Svg>
);
export const IconTag: React.FC<P> = (p) => (
	<Svg {...p}><path d="M10 34V12h22l22 22-22 22z" /><circle cx="21" cy="23" r="3" /></Svg>
);
export const IconBox: React.FC<P> = (p) => (
	<Svg {...p}><path d="M32 8l22 11v26L32 56 10 45V19z" /><path d="M10 19l22 11 22-11M32 30v26" /></Svg>
);
export const IconLeak: React.FC<P> = (p) => (
	<Svg {...p}><circle cx="32" cy="26" r="16" /><path d="M25 26h14" /><path d="M24 50l-2 6M32 48v8M40 50l2 6" /></Svg>
);
export const IconMoon: React.FC<P> = (p) => (
	<Svg {...p}><path d="M44 42A20 20 0 0 1 24 14a20 20 0 1 0 20 28z" /></Svg>
);
export const IconBookmark: React.FC<P> = (p) => (
	<Svg {...p}><path d="M18 8h28v48L32 46 18 56z" /></Svg>
);
export const IconPerson: React.FC<P> = (p) => (
	<Svg {...p}><circle cx="32" cy="20" r="10" /><path d="M14 56c0-10 8-18 18-18s18 8 18 18" /></Svg>
);
export const IconBot: React.FC<P> = (p) => (
	<Svg {...p}><rect x="12" y="20" width="40" height="30" rx="10" /><path d="M32 12v8" /><circle cx="32" cy="10" r="3" /><circle cx="25" cy="35" r="3" fill={p.color ?? C.text} /><circle cx="39" cy="35" r="3" fill={p.color ?? C.text} /></Svg>
);
