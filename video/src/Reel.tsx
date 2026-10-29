import React from 'react';
import {AbsoluteFill, Audio, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {SCENES} from './scenes';
import {Subtitles, makeChunks} from './Subtitles';
import {C, FPS} from './theme';
import {CartoonAvatar} from './CartoonAvatar';
import {AvatarProps, Line, ReelProps} from './types';

const Background: React.FC = () => {
	const f = useCurrentFrame();
	// Мягкое тёплое пятно медленно плавает — фон живой, но без шума.
	const x = 50 + 18 * Math.sin(f / 140);
	const y = 38 + 10 * Math.cos(f / 170);
	return (
		<AbsoluteFill style={{
			background: `radial-gradient(900px 900px at ${x}% ${y}%, rgba(233,165,107,0.10), transparent 70%),
				radial-gradient(1400px 1600px at 50% 40%, ${C.bg}, ${C.bgDeep})`,
		}} />
	);
};

const Avatar: React.FC<{avatar: AvatarProps; fadeOut: number}> = ({avatar, fadeOut}) => {
	const f = useCurrentFrame();
	const o = interpolate(f, [fadeOut - 6, fadeOut], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	return (
		<AbsoluteFill style={{opacity: o}}>
			{avatar.video ? (
				<OffthreadVideo src={staticFile(avatar.video)} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
			) : (
				<CartoonAvatar image={avatar.image} face={avatar.face} mouth={avatar.mouth} />
			)}
		</AbsoluteFill>
	);
};

export const Reel: React.FC<ReelProps> = ({voice, avatar, lines, demo, duration}) => {
	const chunks = makeChunks(lines);
	const total = Math.ceil((duration + 0.6) * FPS);
	const hooks = lines.filter((l) => l.visual.type === 'avatar');
	const avatarEnd = hooks.length ? Math.round(lines[hooks.length].start * FPS) : 0;

	return (
		<AbsoluteFill style={{background: C.bgDeep}}>
			<Background />
			{lines.map((line, i) => {
				if (line.visual.type === 'avatar') return null;
				const from = Math.round(line.start * FPS) - 4;
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
					<Sequence key={line.id} from={from} durationInFrames={Math.max(1, to - from)}>
						{Scene ? <Scene line={line} demo={demo} continued={continued} cue={cue} /> : null}
					</Sequence>
				);
			})}
			{avatar && hooks.length ? (
				<Sequence from={0} durationInFrames={avatarEnd + 2}>
					<Avatar avatar={avatar} fadeOut={avatarEnd} />
				</Sequence>
			) : null}
			<Subtitles chunks={chunks} />
			<Audio src={staticFile(voice)} />
		</AbsoluteFill>
	);
};
