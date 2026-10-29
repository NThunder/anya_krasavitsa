import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {FONT, SUB_TOP} from './theme';
import {Line, Word} from './types';

type Chunk = {text: string; start: number; end: number};

// Режем речь на короткие фразы: до 4 слов / ~24 символов, рвём после знаков препинания.
export const makeChunks = (lines: Line[]): Chunk[] => {
	const chunks: Chunk[] = [];
	for (const line of lines) {
		let cur: Word[] = [];
		const flush = () => {
			if (!cur.length) return;
			chunks.push({text: cur.map((w) => w.w).join(' '), start: cur[0].start, end: cur[cur.length - 1].end});
			cur = [];
		};
		for (const w of line.words) {
			const len = cur.map((x) => x.w).join(' ').length + w.w.length;
			if (cur.length && (cur.length >= 4 || len > 24)) flush();
			cur.push(w);
			if (/[.,!?:;—»]$/.test(w.w)) flush();
		}
		flush();
	}
	// Фраза висит до начала следующей (если пауза короткая).
	return chunks.map((c, i) => {
		const next = chunks[i + 1];
		const end = next && next.start - c.end < 0.7 ? next.start : c.end + 0.25;
		return {...c, end};
	});
};

// Субтитры всегда одинаковые: белые, средний размер, по центру в нижней части кадра.
export const Subtitles: React.FC<{chunks: Chunk[]}> = ({chunks}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;
	const c = chunks.find((x) => t >= x.start - 0.02 && t < x.end);
	if (!c) return null;
	return (
		<AbsoluteFill style={{top: SUB_TOP, height: 200, alignItems: 'center', justifyContent: 'flex-start'}}>
			<div style={{
				maxWidth: 900, textAlign: 'center', fontFamily: FONT, fontWeight: 700, fontSize: 58,
				lineHeight: 1.18, color: '#ffffff', letterSpacing: -0.5,
				textShadow: '0 2px 14px rgba(0,0,0,0.45), 0 0 2px rgba(0,0,0,0.6)',
			}}>
				{c.text}
			</div>
		</AbsoluteFill>
	);
};
