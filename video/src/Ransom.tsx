import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {RANSOM_FONTS, STAGE} from './theme';
import {SceneProps} from './types';
import {useEnter} from './ui';

// Пары «бумажка / буква», как в шаблоне. null — буква без подложки, прямо на листе.
const PIECES: ([string, string] | null)[] = [
	['#f4efe4', '#1d1b1a'], ['#1d1b1a', '#f4efe4'], ['#7fcfc3', '#c79f1c'], ['#3f7a55', '#f4efe4'],
	['#d8433f', '#f7ecd8'], ['#f2d23c', '#1d1b1a'], ['#e64a8a', '#f7ecd8'], ['#2e4a8f', '#f7f0c9'],
	null, ['#f7f0c9', '#d8433f'], ['#c8e6cf', '#2b2f55'], ['#ffffff', '#e64a8a'], null, ['#d9c7a7', '#5a3a22'],
];

// Детерминированный «случайный» генератор, чтобы кадры рендера совпадали.
const rnd = (i: number, k: number) => {
	const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
	return x - Math.floor(x);
};

const Letter: React.FC<{ch: string; i: number; start: number; size: number}> = ({ch, i, start, size}) => {
	const f = useCurrentFrame();
	const {fps} = useVideoConfig();
	const font = RANSOM_FONTS[Math.floor(rnd(i, 1) * RANSOM_FONTS.length)];
	const piece = PIECES[Math.floor(rnd(i, 2) * PIECES.length)];
	const rot = (rnd(i, 3) - 0.5) * 14;
	const s = size * (0.86 + rnd(i, 4) * 0.28);
	// Клочок бумаги с неровными краями.
	const j = (k: number) => (rnd(i, k) * 9).toFixed(1);
	const clip = `polygon(${j(5)}% ${j(6)}%, 52% ${j(7)}%, ${100 - +j(8)}% ${j(9)}%, ${100 - +j(10)}% 55%, ${100 - +j(11)}% ${100 - +j(12)}%, 45% ${100 - +j(13)}%, ${j(14)}% ${100 - +j(15)}%, ${j(16)}% 48%)`;

	// Влетает крупно с поворотом и садится на место (как в шаблоне).
	const p = spring({frame: f - start, fps, config: {damping: 14, mass: 0.6}});
	const scale = interpolate(p, [0, 1], [3.2, 1]);
	const dx = interpolate(p, [0, 1], [(rnd(i, 17) - 0.5) * 700, 0]);
	const dy = interpolate(p, [0, 1], [380 + rnd(i, 18) * 300, 0]);
	const r = interpolate(p, [0, 1], [rot + (rnd(i, 19) - 0.5) * 70, rot]);
	if (f < start) return <span style={{display: 'inline-block', width: s * 0.72}} />;
	return (
		<span style={{
			display: 'inline-block', position: 'relative', margin: '0 3px', zIndex: f - start < 10 ? 10 : 1,
			transform: `translate(${dx}px, ${dy}px) rotate(${r}deg) scale(${scale})`,
			filter: 'drop-shadow(0 4px 3px rgba(0,0,0,0.25))',
		}}>
			<span style={{
				display: 'inline-block', padding: piece ? `${s * 0.05}px ${s * 0.12}px ${s * 0.02}px` : `0 ${s * 0.04}px`,
				background: piece ? piece[0] : 'transparent', clipPath: piece ? clip : undefined,
				color: piece ? piece[1] : '#1d1b1a', fontFamily: `'${font.family}'`, fontWeight: font.weight as any,
				fontStyle: font.style ?? 'normal', fontSize: s, lineHeight: 1.05,
			}}>
				{ch}
			</span>
		</span>
	);
};

// Заголовок из букв «как из газеты» для вступления.
export const Ransom: React.FC<SceneProps> = ({line, continued}) => {
	const lines: string[] = line.visual.text.split('\n');
	const longest = Math.max(...lines.map((l) => l.length));
	const size = Math.min(190, (STAGE.w - 120) / (longest * 0.82));
	const sub = useEnter(10);
	let idx = 0;
	return (
		<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 18}}>
			{lines.map((l, li) => (
				<div key={li} style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
					{[...l].map((ch) => {
						const i = idx++;
						return ch === ' '
							? <span key={i} style={{width: size * 0.35}} />
							: <Letter key={i} ch={ch} i={i} start={continued ? -999 : 4 + i * 3} size={size} />;
					})}
				</div>
			))}
			{line.visual.sub && (
				<div style={{
					marginTop: 40, padding: '14px 34px', background: '#f7f0c9', transform: `rotate(-2deg) scale(${0.6 + 0.4 * sub})`,
					opacity: sub, fontFamily: "'R PTSerif'", fontStyle: 'italic', fontWeight: 700, fontSize: 54, color: '#1d1b1a',
					boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
				}}>
					{line.visual.sub}
				</div>
			)}
		</AbsoluteFill>
	);
};
