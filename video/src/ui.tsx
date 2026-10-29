import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT} from './theme';

// Плавное появление: 0 -> 1 с пружиной. Если сцена продолжает предыдущую, сразу 1.
export const useEnter = (delay = 0, enabled = true, damping = 18) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	if (!enabled) return 1;
	return spring({frame: frame - delay, fps, config: {damping, mass: 0.7}});
};

// Значение 0 -> 1 линейно между кадрами a и b.
export const useProgress = (a: number, b: number) => {
	const frame = useCurrentFrame();
	return interpolate(frame, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
};

export const rise = (v: number, px = 40): React.CSSProperties => ({
	opacity: v,
	transform: `translateY(${(1 - v) * px}px)`,
});

export const Title: React.FC<{children: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties}> = ({
	children, size = 88, color = C.text, style,
}) => (
	<div style={{
		fontFamily: FONT, fontWeight: 800, fontSize: size, lineHeight: 1.06, color,
		letterSpacing: -1.5, textAlign: 'center', whiteSpace: 'pre-line', ...style,
	}}>
		{children}
	</div>
);

export const Pill: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
	<div style={{
		display: 'inline-flex', alignItems: 'center', gap: 12, padding: '12px 28px', borderRadius: 999,
		background: C.accent, color: C.bgDeep, fontFamily: FONT, fontWeight: 800, fontSize: 34,
		transform: 'rotate(-2deg)', boxShadow: '0 4px 8px rgba(20,22,50,0.2)', ...style,
	}}>
		{children}
	</div>
);

export const Card: React.FC<{children: React.ReactNode; active?: boolean; style?: React.CSSProperties}> = ({
	children, active, style,
}) => (
	<div style={{
		// Бумажки коллажа: кремовая, выделенная — жёлтая как звёзды шаблона.
		background: active ? C.sun : C.card,
		boxShadow: '0 6px 14px rgba(20,22,50,0.18)',
		borderRadius: 18, ...style,
	}}>
		{children}
	</div>
);

// Кружок с иконкой внутри.
export const Badge: React.FC<{children: React.ReactNode; size?: number; active?: boolean; style?: React.CSSProperties}> = ({
	children, size = 120, active, style,
}) => (
	<div style={{
		width: size, height: size, borderRadius: size, display: 'flex', alignItems: 'center', justifyContent: 'center',
		background: active ? C.accent : C.card, boxShadow: '0 5px 12px rgba(20,22,50,0.18)', ...style,
	}}>
		{children}
	</div>
);

// Печать текста по буквам с момента start, скорость cps символов в секунду.
export const Typed: React.FC<{text: string; start: number; cps?: number; style?: React.CSSProperties}> = ({
	text, start, cps = 45, style,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const n = Math.max(0, Math.floor(((frame - start) / fps) * cps));
	const shown = text.slice(0, n);
	return (
		<span style={style}>
			{shown}
			<span style={{opacity: 0}}>{text.slice(n)}</span>
		</span>
	);
};

export const Spinner: React.FC<{size?: number}> = ({size = 40}) => {
	const frame = useCurrentFrame();
	return (
		<svg width={size} height={size} viewBox="0 0 40 40" style={{transform: `rotate(${frame * 12}deg)`}}>
			<circle cx="20" cy="20" r="16" stroke={C.line} strokeWidth="4" fill="none" />
			<path d="M20 4a16 16 0 0 1 16 16" stroke={C.accent} strokeWidth="4" fill="none" strokeLinecap="round" />
		</svg>
	);
};

export const Check: React.FC<{size?: number; v?: number}> = ({size = 40, v = 1}) => (
	<svg width={size} height={size} viewBox="0 0 40 40">
		<circle cx="20" cy="20" r="18" fill={C.accent} opacity={v} />
		<path d="M12 20.5l5.5 5.5L28.5 15" stroke={C.bgDeep} strokeWidth="4.5" fill="none" strokeLinecap="round"
			strokeLinejoin="round" strokeDasharray="30" strokeDashoffset={30 * (1 - v)} />
	</svg>
);
