import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, CONTENT, FONT} from './theme';
import {SceneProps} from './types';
import {Badge, Card, Check, Pill, Spinner, Title, Typed, rise, useEnter, useProgress} from './ui';
import {
	IconAlert, IconBookmark, IconBot, IconChart, IconChat, IconCoins, IconCrown, IconLeak,
	IconMoon, IconMug, IconNews, IconPerson, IconTag, IconTarget, IconBox,
} from './icons';

const Stage: React.FC<{children: React.ReactNode; gap?: number}> = ({children, gap = 56}) => (
	<AbsoluteFill style={{
		top: CONTENT.top, height: CONTENT.bottom - CONTENT.top, padding: '0 70px',
		display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap,
	}}>
		{children}
	</AbsoluteFill>
);

const lerp = (f: number, a: number, b: number, from = 0, to = 1) =>
	interpolate(f, [a, b], [from, to], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

// ---------- 350 ботов и 1 человек ----------
export const Swarm: React.FC<SceneProps> = ({line, cue}) => {
	const f = useCurrentFrame();
	const {count = 350, label = 'ботов', sub = 'и 1 человек'} = line.visual;
	const s0 = 6; // счётчик стартует сразу, без пустой паузы
	const s1 = cue(/отдел/, 120);
	const shown = Math.round(count * lerp(f, s0, s0 + 75));
	const cols = 25;
	const head = useEnter(0);
	const person = useEnter(s1 - 6);
	return (
		<Stage gap={48}>
			<div style={{...rise(head), display: 'flex', alignItems: 'baseline', gap: 22}}>
				<Title size={190} style={{fontVariantNumeric: 'tabular-nums'}}>{String(shown)}</Title>
				<Title size={72} color={C.muted}>{label}</Title>
			</div>
			<div style={{display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 13}}>
				{Array.from({length: count}).map((_, i) => {
					// Точки зажигаются волной от центра.
					const r = Math.hypot((i % cols) - cols / 2, Math.floor(i / cols) - 7) / 15;
					const v = lerp(f, s0 + r * 66, s0 + r * 66 + 8);
					return <div key={i} style={{
						width: 21, height: 21, borderRadius: 21, background: C.text,
						opacity: 0.12 + 0.55 * v, transform: `scale(${0.4 + 0.6 * v})`,
					}} />;
				})}
			</div>
			<div style={{...rise(person), display: 'flex', alignItems: 'center', gap: 26}}>
				<Badge size={110} active><IconPerson size={64} color={C.bgDeep} /></Badge>
				<Title size={64} style={{textAlign: 'left'}}>{sub}</Title>
			</div>
		</Stage>
	);
};

// ---------- 6 ботов — 6 задач ----------
const ROLES = [
	{icon: IconChart, label: 'следит\nза рынком'},
	{icon: IconTarget, label: 'ищет\nудачный момент'},
	{icon: IconNews, label: 'читает\nновости'},
	{icon: IconCoins, label: 'следит за\nкрупными игроками'},
	{icon: IconAlert, label: 'ищет\nриски'},
	{icon: IconCrown, label: 'главный'},
];
const ORDINALS = [/Первый/, /Второй/, /Третий/, /Четв/, /пятый/i, /Шестой/];

export const Roles: React.FC<SceneProps> = ({line, continued, cue}) => {
	const f = useCurrentFrame();
	const {title, highlight = []}: {title: string; highlight: number[]} = line.visual as any;
	const head = useEnter(0, !continued);
	const span = Math.max(30, cue(/работа/, 60));
	const on = highlight.filter((i) => f >= cue(ORDINALS[i], 0) - 4);
	return (
		<Stage gap={60}>
			<Title size={76} style={rise(head)}>{title}</Title>
			<div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, width: 940}}>
				{ROLES.map((r, i) => {
					const v = continued ? 1 : lerp(f, (i * span) / 8, (i * span) / 8 + 12);
					const active = on.includes(i);
					const dim = highlight.length > 0 && !active;
					const Icon = r.icon;
					return (
						<Card key={i} active={active} style={{
							height: 230, padding: '30px 34px', display: 'flex', flexDirection: 'column',
							justifyContent: 'space-between', opacity: v * (dim ? 0.38 : 1),
							transform: `translateY(${(1 - v) * 30}px) scale(${active ? 1.03 : 1})`,
						}}>
							<div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
								<Icon size={66} color={active ? C.accent : C.text} />
								<span style={{fontFamily: FONT, fontWeight: 700, fontSize: 30, color: C.muted}}>#{i + 1}</span>
							</div>
							<div style={{fontFamily: FONT, fontWeight: 700, fontSize: 38, lineHeight: 1.15, color: C.text, whiteSpace: 'pre-line'}}>
								{r.label}
							</div>
						</Card>
					);
				})}
			</div>
		</Stage>
	);
};

// ---------- Бот-скептик ----------
export const Question: React.FC<SceneProps> = ({line, cue}) => {
	const enter = useEnter(0);
	const start = 8;
	return (
		<Stage gap={64}>
			<div style={{...rise(enter), display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30}}>
				<Badge size={190} active><IconAlert size={110} color={C.bgDeep} /></Badge>
				<Pill>бот №5</Pill>
			</div>
			<Title size={104}>
				{/* Печатаем вопрос синхронно с голосом */}
				<Typed text={line.visual.text} start={start} cps={22} />
			</Title>
		</Stage>
	);
};

// ---------- Записки -> главный -> хозяину ----------
export const Flow: React.FC<SceneProps> = ({line, cue}) => {
	const f = useCurrentFrame();
	const {fps} = useVideoConfig();
	const icons = [IconChart, IconTarget, IconNews, IconCoins, IconAlert];
	const enter = useEnter(0);
	const lead = useEnter(4);
	const tMsg = cue(/хозяину/, 90);
	const tYes = cue(/да/i, 140);
	const msg = useEnter(tMsg - 4);
	const xs = [130, 300, 470, 640, 810];
	const leadY = 470;
	const pulse = f > tYes ? 1 + 0.06 * Math.sin(((f - tYes) / fps) * Math.PI * 4) : 1;
	return (
		<AbsoluteFill style={{top: CONTENT.top, height: CONTENT.bottom - CONTENT.top}}>
			<svg width={1080} height={700} style={{position: 'absolute', left: 0, top: 0}}>
				{xs.map((x, i) => (
					<path key={i} d={`M${x + 70} 150 C ${x + 70} 330, 540 300, 540 ${leadY - 40}`}
						stroke={C.line} strokeWidth={3} fill="none" strokeDasharray="10 12" opacity={enter} />
				))}
				<path d={`M540 ${leadY + 140} L540 650`} stroke={C.line} strokeWidth={3} strokeDasharray="10 12" opacity={msg} />
				{xs.map((x, i) => {
					// Записка едет по кривой к главному боту, по кругу.
					const t = ((f + i * 9) % 50) / 50;
					const bx = (1 - t) ** 3 * (x + 70) + 3 * (1 - t) ** 2 * t * (x + 70) + 3 * (1 - t) * t ** 2 * 540 + t ** 3 * 540;
					const by = (1 - t) ** 3 * 150 + 3 * (1 - t) ** 2 * t * 330 + 3 * (1 - t) * t ** 2 * 300 + t ** 3 * (leadY - 40);
					return <rect key={i} x={bx - 16} y={by - 11} width={32} height={22} rx={5} fill={C.text}
						opacity={enter * Math.sin(t * Math.PI) * 0.9} />;
				})}
			</svg>
			<div style={{position: 'absolute', top: 10, left: 0, width: 1080, height: 140}}>
				{xs.map((x, i) => {
					const Icon = icons[i];
					const v = lerp(f, i * 3, i * 3 + 12);
					return (
						<Badge key={i} size={140} style={{position: 'absolute', left: x, opacity: v, transform: `scale(${0.7 + 0.3 * v})`}}>
							<Icon size={68} />
						</Badge>
					);
				})}
			</div>
			<div style={{position: 'absolute', top: leadY - 50, width: 1080, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, ...rise(lead)}}>
				<Badge size={180} active><IconCrown size={100} color={C.bgDeep} /></Badge>
				<div style={{fontFamily: FONT, fontWeight: 800, fontSize: 44, color: C.text}}>главный</div>
			</div>
			<div style={{position: 'absolute', top: 680, width: 1080, display: 'flex', justifyContent: 'center', ...rise(msg)}}>
				<Card style={{width: 860, padding: '34px 40px', background: C.bgDeep, display: 'flex', flexDirection: 'column', gap: 26}}>
					<div style={{display: 'flex', alignItems: 'center', gap: 18}}>
						<Badge size={64} active><IconCrown size={36} color={C.bgDeep} /></Badge>
						<div style={{fontFamily: FONT, fontWeight: 700, fontSize: 32, color: C.muted}}>Главный бот · сейчас</div>
					</div>
					<div style={{fontFamily: FONT, fontWeight: 800, fontSize: 46, color: C.text}}>
						{line.visual.message}: {line.visual.question}
					</div>
					<div style={{display: 'flex', gap: 20}}>
						<div style={{flex: 1, textAlign: 'center', padding: '20px 0', borderRadius: 24, background: C.accent, color: C.bgDeep,
							fontFamily: FONT, fontWeight: 800, fontSize: 40, transform: `scale(${pulse})`}}>Да</div>
						<div style={{flex: 1, textAlign: 'center', padding: '20px 0', borderRadius: 24, border: `2px solid ${C.line}`,
							color: C.text, fontFamily: FONT, fontWeight: 800, fontSize: 40}}>Нет</div>
					</div>
				</Card>
			</div>
		</AbsoluteFill>
	);
};

// ---------- Без аналитиков, круглосуточно ----------
export const Night: React.FC<SceneProps> = ({line, cue}) => {
	const f = useCurrentFrame();
	const tBots = cue(/Боты/, 45);
	const tClock = cue(/три/, 110);
	const strike = useProgress(14, 30);
	const people = useEnter(0);
	const bots = useEnter(tBots - 4);
	const clock = useEnter(tClock - 4);
	const swap = lerp(f, tClock - 8, tClock + 4);
	return (
		<Stage gap={70}>
			<div style={{height: 300, position: 'relative', width: 940, display: 'flex', justifyContent: 'center'}}>
				<div style={{position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24,
					opacity: people * (1 - swap) * 0.9}}>
					<div style={{display: 'flex', gap: 30}}>
						{[0, 1, 2].map((i) => <IconPerson key={i} size={110} color={C.muted} />)}
					</div>
					<div style={{position: 'relative'}}>
						<Title size={60} color={C.muted}>аналитики в штате</Title>
						<div style={{position: 'absolute', left: 0, top: '52%', height: 6, borderRadius: 6, background: C.accent,
							width: `${strike * 100}%`}} />
					</div>
				</div>
				<div style={{position: 'absolute', display: 'flex', alignItems: 'center', gap: 34, ...rise(clock * swap)}}>
					<IconMoon size={130} color={C.accent} />
					<Title size={200} style={{fontVariantNumeric: 'tabular-nums'}}>{line.visual.time}</Title>
				</div>
			</div>
			<div style={{position: 'relative', width: 900, height: 230, ...rise(bots)}}>
				<svg width={900} height={230} style={{position: 'absolute'}}>
					{[0, 1].map((k) => {
						const t = ((f + k * 22) % 44) / 44;
						const x0 = 150 + k * 300;
						return <rect key={k} x={x0 + t * 300 - 16} y={60 - Math.sin(t * Math.PI) * 50} width={32} height={22} rx={5}
							fill={C.accent} opacity={Math.sin(t * Math.PI)} />;
					})}
				</svg>
				{[0, 1, 2].map((i) => (
					<Badge key={i} size={150} style={{position: 'absolute', left: 75 + i * 300, top: 80}}>
						<IconBot size={84} />
					</Badge>
				))}
			</div>
			<Pill style={{...rise(bots), fontSize: 38}}>{line.visual.label}</Pill>
		</Stage>
	);
};

// ---------- Переход к проверке ----------
export const Chapter: React.FC<SceneProps> = ({line}) => {
	const a = useEnter(0);
	const b = useEnter(8);
	const c = useEnter(14);
	return (
		<Stage gap={56}>
			<Badge size={260} active style={{...rise(a), transform: `scale(${0.6 + 0.4 * a})`}}>
				<IconMug size={150} color={C.bgDeep} />
			</Badge>
			<Pill style={rise(b)}>{line.visual.kicker}</Pill>
			<Title size={100} style={rise(c)}>{line.visual.title}</Title>
		</Stage>
	);
};

// ---------- Живой запуск команды агентов ----------
const DEMO_ICONS = [IconChat, IconTag, IconBox, IconLeak];
const DEMO_CUES = [/отзыв/, /цены/, /склад/, /потер/];
const DEMO_NAMES = ['Отзывы', 'Цены', 'Склад', 'Потери'];

export const DemoRun: React.FC<SceneProps> = ({line, demo, continued, cue}) => {
	const f = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {phase, highlight = []}: {phase: string; highlight: number[]} = line.visual as any;
	const done = phase === 'done';
	const panel = useEnter(0, !continued);
	const notes = demo?.notes ?? [];
	const runFor = 1.1 * fps; // «агент думает» перед ответом
	return (
		<Stage gap={0}>
			<Card style={{width: 960, padding: '36px 36px 20px', background: C.bgDeep, ...rise(panel)}}>
				<div style={{display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20}}>
					<div style={{width: 18, height: 18, borderRadius: 18, background: C.accent}} />
					<div style={{fontFamily: FONT, fontWeight: 700, fontSize: 32, color: C.muted}}>
						команда агентов · магазин кружек
					</div>
				</div>
				{notes.slice(0, 4).map((n, i) => {
					const t0 = done ? -999 : cue(DEMO_CUES[i], i * 40);
					const v = done || continued ? Math.max(done ? 1 : 0, lerp(f, t0 - 4, t0 + 8)) : lerp(f, t0 - 4, t0 + 8);
					const finished = done || f > t0 + runFor;
					const dim = done && highlight.length > 0 && !highlight.includes(i);
					const hot = done && highlight.includes(i);
					const Icon = DEMO_ICONS[i];
					return (
						<div key={i} style={{
							display: 'flex', gap: 26, padding: '26px 0', borderTop: `2px solid ${C.line}`,
							opacity: v * (dim ? 0.35 : 1), transform: `translateX(${(1 - v) * 40}px)`,
						}}>
							<Badge size={96} active={hot}><Icon size={52} color={hot ? C.bgDeep : C.text} /></Badge>
							<div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: 10}}>
								<div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
									<span style={{fontFamily: FONT, fontWeight: 800, fontSize: 38, color: hot ? C.accent : C.text}}>
										{DEMO_NAMES[i]}
									</span>
									{finished ? <Check size={42} v={done ? 1 : lerp(f, t0 + runFor, t0 + runFor + 8)} /> : <Spinner size={42} />}
								</div>
								<div style={{fontFamily: FONT, fontWeight: 500, fontSize: 34, lineHeight: 1.3, color: C.text, minHeight: 88}}>
									{done ? n.note : <Typed text={n.note} start={t0 + runFor} cps={70} />}
								</div>
							</div>
						</div>
					);
				})}
			</Card>
		</Stage>
	);
};

// ---------- Сообщение от главного агента на телефоне ----------
export const Phone: React.FC<SceneProps> = ({demo, cue}) => {
	const f = useCurrentFrame();
	const {fps} = useVideoConfig();
	const phone = useEnter(0);
	const note = useEnter(10);
	const tYes = cue(/^Да$|^Да[.,]/, 150);
	const tap = lerp(f, tYes - 6, tYes + 4);
	const pressed = f > tYes + 2;
	const lead = demo?.lead;
	return (
		<Stage gap={0}>
			<div style={{
				width: 640, height: 1030, borderRadius: 80, border: `3px solid ${C.line}`, background: C.bgDeep,
				padding: '40px 32px', display: 'flex', flexDirection: 'column', gap: 30, ...rise(phone, 80),
			}}>
				<div style={{alignSelf: 'center', width: 170, height: 40, borderRadius: 40, background: '#0f1522'}} />
				<div style={{fontFamily: FONT, fontWeight: 800, fontSize: 110, color: C.text, textAlign: 'center', letterSpacing: -3}}>09:41</div>
				<div style={{...rise(note), background: 'rgba(255,255,255,0.08)', borderRadius: 40, padding: 30,
					display: 'flex', flexDirection: 'column', gap: 20}}>
					<div style={{display: 'flex', alignItems: 'center', gap: 14}}>
						<Badge size={56} active><IconCrown size={32} color={C.bgDeep} /></Badge>
						<span style={{fontFamily: FONT, fontWeight: 700, fontSize: 28, color: C.muted}}>Главный агент · сейчас</span>
					</div>
					<div style={{fontFamily: FONT, fontWeight: 500, fontSize: 31, lineHeight: 1.3, color: C.text}}>{lead?.message}</div>
					<div style={{fontFamily: FONT, fontWeight: 800, fontSize: 36, lineHeight: 1.2, color: C.text}}>{lead?.question}</div>
					<Pill style={{alignSelf: 'flex-start', fontSize: 28, padding: '8px 20px'}}>{lead?.effect}</Pill>
					<div style={{display: 'flex', gap: 16, position: 'relative'}}>
						<div style={{flex: 1, textAlign: 'center', padding: '18px 0', borderRadius: 22,
							background: C.accent, color: C.bgDeep, fontFamily: FONT, fontWeight: 800, fontSize: 36,
							transform: `scale(${pressed ? 0.95 : 1})`}}>{pressed ? 'Да ✓' : 'Да'}</div>
						<div style={{flex: 1, textAlign: 'center', padding: '18px 0', borderRadius: 22,
							border: `2px solid ${C.line}`, color: C.text, fontFamily: FONT, fontWeight: 800, fontSize: 36}}>Нет</div>
						{/* Палец-курсор нажимает «Да» */}
						<div style={{position: 'absolute', left: 120, top: 30, width: 64, height: 64, borderRadius: 64,
							background: 'rgba(246,241,234,0.55)', border: `3px solid ${C.text}`,
							opacity: tap * (1 - lerp(f, tYes + 10, tYes + 22)),
							transform: `translate(${(1 - tap) * 120}px, ${(1 - tap) * 140}px) scale(${pressed ? 0.8 : 1})`}} />
					</div>
				</div>
			</div>
		</Stage>
	);
};

// ---------- Вывод ----------
export const Statement: React.FC<SceneProps> = ({line, cue}) => {
	const f = useCurrentFrame();
	const tTeam = cue(/команде/, 60);
	const left = useEnter(0);
	const right = useEnter(tTeam - 4);
	const strike = lerp(f, tTeam - 10, tTeam + 6);
	return (
		<Stage gap={50}>
			<Title size={70} color={C.muted} style={rise(left)}>секрет</Title>
			<div style={{display: 'flex', gap: 30, width: 940}}>
				<Card style={{flex: 1, height: 520, padding: 40, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
					opacity: left * (1 - 0.55 * strike), ...{transform: `translateY(${(1 - left) * 30}px)`}}}>
					<IconBot size={120} color={C.muted} />
					<div style={{position: 'relative'}}>
						<Title size={60} style={{textAlign: 'left'}}>{line.visual.left}</Title>
						<div style={{position: 'absolute', left: 0, top: '48%', height: 6, borderRadius: 6, background: C.accent, width: `${strike * 100}%`}} />
					</div>
				</Card>
				<Card active style={{flex: 1, height: 520, padding: 40, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', ...rise(right)}}>
					<div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, width: 240}}>
						{Array.from({length: 6}).map((_, i) => <IconBot key={i} size={70} color={C.accent} />)}
					</div>
					<Title size={60} color={C.accent} style={{textAlign: 'left'}}>{line.visual.right}</Title>
				</Card>
			</div>
		</Stage>
	);
};

export const Cta: React.FC<SceneProps> = ({line}) => {
	const f = useCurrentFrame();
	const a = useEnter(0);
	const b = useEnter(10);
	const fill = lerp(f, 18, 32);
	return (
		<Stage gap={56}>
			<div style={{position: 'relative', ...rise(a)}}>
				<Badge size={260} active={fill > 0.5}>
					<IconBookmark size={140} color={fill > 0.5 ? C.bgDeep : C.text} />
				</Badge>
			</div>
			<Title size={110} style={rise(a)}>{line.visual.title}</Title>
			<Title size={54} color={C.muted} style={{...rise(b), fontWeight: 700}}>{line.visual.sub}</Title>
		</Stage>
	);
};

export const SCENES: Record<string, React.FC<SceneProps>> = {
	swarm: Swarm, roles: Roles, question: Question, flow: Flow, night: Night,
	chapter: Chapter, demo_run: DemoRun, phone: Phone, statement: Statement, cta: Cta,
};
