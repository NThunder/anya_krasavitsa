export type Word = {w: string; start: number; end: number};

export type Line = {
	id: string;
	act: string;
	text: string;
	start: number;
	end: number;
	words: Word[];
	visual: {type: string; [k: string]: any};
};

export type Demo = {
	notes: {agent: string; note: string}[];
	lead: {message: string; question: string; effect: string};
};

export type AvatarProps = {
	video?: string; // готовый говорящий аватар (если генерировался моделью)
	image: string; // иначе — рисованная картинка + локальная анимация рта
	face: import('./CartoonAvatar').Face;
	mouth: number[];
};

export type ReelProps = {
	duration: number;
	voice: string;
	avatar: AvatarProps | null;
	lines: Line[];
	demo: Demo | null;
};

export type SceneProps = {
	line: Line;
	demo: Demo | null;
	continued: boolean; // предыдущая сцена того же типа — не повторяем появление
	cue: (pattern: RegExp, fallback?: number) => number; // кадр слова внутри реплики
};
