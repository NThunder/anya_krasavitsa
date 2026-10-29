import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {CartoonAvatar} from './CartoonAvatar';
import {SCENES} from './scenes';
import {Subtitles, makeChunks} from './Subtitles';
import {AVATAR, BOARD, C, FPS, PAPER, STAGE, STAGE_SCALE} from './theme';
import {Line, ReelProps} from './types';

// Лист в руках из шаблона: «впрыгивает» в начале и чуть покачивается.
const Board: React.FC<{children: React.ReactNode}> = ({children}) => {
	const f = useCurrentFrame();
	const {fps} = useVideoConfig();
	const p = spring({frame: f, fps, config: {damping: 12, mass: 0.7}});
	const float = `translateY(${Math.sin(f / 30) * 4}px) rotate(${Math.sin(f / 53) * 0.4}deg)`;
	return (
		<AbsoluteFill style={{
			transformOrigin: '50% 30%',
			transform: `${float} scale(${interpolate(p, [0, 1], [0.55, 1])}) rotate(${interpolate(p, [0, 1], [-9, 0])}deg)`,
			opacity: Math.min(1, p * 2),
		}}>
			<Img src={staticFile(BOARD.src)} style={{
				position: 'absolute', left: BOARD.left, top: BOARD.top, width: BOARD.w * BOARD.scale, height: BOARD.h * BOARD.scale,
			}} />
			{/* Виртуальная сцена 1080x1180, вписанная в бумажную часть листа */}
			<div style={{
				position: 'absolute', width: STAGE.w, height: STAGE.h, transformOrigin: '0 0',
				left: PAPER.x + (PAPER.w - STAGE.w * STAGE_SCALE) / 2,
				top: PAPER.y + (PAPER.h - STAGE.h * STAGE_SCALE) / 2,
				transform: `scale(${STAGE_SCALE})`,
			}}>
				{children}
			</div>
		</AbsoluteFill>
	);
};

export const Reel: React.FC<ReelProps> = ({voice, avatar, lines, demo, duration}) => {
	const f = useCurrentFrame();
	const {fps} = useVideoConfig();
	const chunks = makeChunks(lines);
	const total = Math.ceil((duration + 0.6) * FPS);
	const rise = spring({frame: f - 6, fps, config: {damping: 16}});

	return (
		<AbsoluteFill style={{background: C.bg}}>
			<Board>
				{lines.map((line, i) => {
					const from = i === 0 ? 0 : Math.round(line.start * FPS) - 4;
					const to = i + 1 < lines.length ? Math.round(lines[i + 1].start * FPS) - 4 : total;
					const Scene = SCENES[line.visual.type];
					const prev: Line | undefined = lines[i - 1];
					const continued = !!prev && prev.visual.type === line.visual.type;
					// Кадр слова внутри реплики (относительно начала сцены).
					const cue = (re: RegExp, fallback = 0) => {
						const w = line.words.find((x) => re.test(x.w));
						return w ? Math.round(w.start * FPS) - from : fallback;
					};
					return (
						<Sequence key={line.id} from={from} durationInFrames={Math.max(1, to - from)} layout="none">
							{Scene ? <Scene line={line} demo={demo} continued={continued} cue={cue} /> : null}
						</Sequence>
					);
				})}
			</Board>
			{avatar ? (
				<AbsoluteFill style={{transform: `translateY(${(1 - rise) * 500}px)`}}>
					<CartoonAvatar image={avatar.image} face={avatar.face} mouth={avatar.mouth} scale={AVATAR.scale} cut={AVATAR.cut} />
				</AbsoluteFill>
			) : null}
			<Subtitles chunks={chunks} />
			<Audio src={staticFile(voice)} />
		</AbsoluteFill>
	);
};
