import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';

export type Face = {
	size: [number, number];
	mouth: {left: [number, number]; right: [number, number]; top: number; bottom: number};
	eyes: {cx: number; cy: number; rx: number; ry: number}[];
	skin: string;
	lid: string;
	lips: string;
	line: string;
};

// Моргаем примерно раз в 2.5–3.5 с, каждый раз по 3 кадра.
const BLINKS = [26, 104, 170, 251, 330, 395, 480];

const Mouth: React.FC<{face: Face; o: number}> = ({face, o}) => {
	const {left, right, top, bottom} = face.mouth;
	const cy = (left[1] + right[1]) / 2;
	const cx = (left[0] + right[0]) / 2;
	const lx = left[0] + 4 * o; // при открытом рте уголки чуть сходятся
	const rx = right[0] - 4 * o;
	const up = cy - top; // высота верхней губы
	const low = bottom - cy + 17 * o; // нижняя губа опускается вместе с челюстью
	const open = 24 * o;
	const upper = `M${lx},${cy} C${lx + 16},${cy - up * 1.1} ${cx - 12},${cy - up * 1.35} ${cx},${cy - up * 0.8} C${cx + 12},${cy - up * 1.35} ${rx - 16},${cy - up * 1.1} ${rx},${cy}`;
	const lower = `C${rx - 14},${cy + low / 0.75} ${lx + 14},${cy + low / 0.75} ${lx},${cy}`;
	const gap = `M${lx + 5},${cy + 1} Q${cx},${cy + 5} ${rx - 5},${cy + 1} Q${cx},${cy + 5 + open * 1.9} ${lx + 5},${cy + 1} Z`;
	return (
		<g>
			<defs>
				<filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.5" /></filter>
				<clipPath id="gap"><path d={gap} /></clipPath>
			</defs>
			{/* Закрашиваем нарисованный рот кожей и рисуем свой */}
			<ellipse cx={cx} cy={cy + 8} rx={(right[0] - left[0]) / 2 + 12} ry={26 + 18 * o} fill={face.skin} filter="url(#soft)" />
			<path d={`${upper} ${lower} Z`} fill={face.lips} />
			{o > 0.04 && (
				<g>
					<path d={gap} fill="#4a1f22" />
					<g clipPath="url(#gap)">
						<path d={`M${lx},${cy - 2} Q${cx},${cy + 4} ${rx},${cy - 2} L${rx},${cy + 6} Q${cx},${cy + 12} ${lx},${cy + 6} Z`} fill="#fbf7f2" />
						<ellipse cx={cx} cy={cy + 5 + open * 1.5} rx={22} ry={9} fill="#b9605e" />
					</g>
					<path d={gap} fill="none" stroke={face.line} strokeWidth={3} />
				</g>
			)}
			<path d={upper} fill="none" stroke={face.line} strokeWidth={3.5} strokeLinecap="round" />
			<path d={`M${rx},${cy} ${lower}`} fill="none" stroke={face.line} strokeWidth={2.5} strokeLinecap="round" opacity={0.85} />
			{o <= 0.04 && <path d={`M${lx},${cy} Q${cx},${cy + 4} ${rx},${cy}`} fill="none" stroke={face.line} strokeWidth={3.5} strokeLinecap="round" />}
			<circle cx={lx} cy={cy} r={3.5} fill={face.line} />
			<circle cx={rx} cy={cy} r={3.5} fill={face.line} />
		</g>
	);
};

const ClosedEyes: React.FC<{face: Face}> = ({face}) => (
	<g>
		{face.eyes.map((e, i) => (
			<g key={i}>
				<ellipse cx={e.cx} cy={e.cy + 1} rx={e.rx + 2} ry={e.ry + 5} fill={face.lid} filter="url(#soft)" />
				<path d={`M${e.cx - e.rx},${e.cy} Q${e.cx},${e.cy + e.ry} ${e.cx + e.rx},${e.cy - 1}`}
					fill="none" stroke={face.line} strokeWidth={4} strokeLinecap="round" />
			</g>
		))}
	</g>
);

// Рисованный аватар: картинка + свой рот по громкости голоса, моргание, лёгкое «дыхание».
export const CartoonAvatar: React.FC<{image: string; face: Face; mouth: number[]}> = ({image, face, mouth}) => {
	const f = useCurrentFrame();
	const o = Math.min(0.85, mouth[Math.min(f, mouth.length - 1)] ?? 0);
	const blink = BLINKS.some((b) => f >= b && f < b + 3);
	const [w, h] = face.size;
	return (
		<AbsoluteFill style={{
			transformOrigin: '50% 30%',
			transform: `translateY(${Math.sin(f / 24) * 4 - o * 3}px) rotate(${Math.sin(f / 41) * 0.6}deg) scale(${1.2 + f * 0.0004})`,
		}}>
			<Img src={staticFile(image)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
			<svg viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
				<Mouth face={face} o={o} />
				{blink && <ClosedEyes face={face} />}
			</svg>
		</AbsoluteFill>
	);
};
