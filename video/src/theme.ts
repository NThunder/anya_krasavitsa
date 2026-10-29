import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

// Палитра по шаблону-коллажу: синий фон, крафтовый лист, тёмно-синие «чернила», красный акцент.
export const C = {
	bg: '#343a66', // синий фон шаблона
	text: '#262a4f', // чернила на бумаге
	muted: '#6d6878',
	accent: '#d9453f',
	accentSoft: 'rgba(217,69,63,0.13)',
	card: '#fbf8f1', // кремовая бумажка
	line: 'rgba(38,42,79,0.18)',
	bgDeep: '#fbf8f1', // светлые панели на листе и иконки на акцентном фоне
	sun: '#f3d63b',
};

export const W = 1080;
export const H = 1920;
export const FPS = 30;

// Лист из шаблона (assets/template/board.png, 1073x1246) и его бумажная часть внутри картинки.
export const BOARD = {src: 'template/board.png', w: 1073, h: 1246, scale: 0.9, left: 52, top: 8};
const PAPER_IN = {x0: 131, y0: 193, x1: 953, y1: 1114};
export const PAPER = {
	x: BOARD.left + PAPER_IN.x0 * BOARD.scale,
	y: BOARD.top + PAPER_IN.y0 * BOARD.scale,
	w: (PAPER_IN.x1 - PAPER_IN.x0) * BOARD.scale,
	h: (PAPER_IN.y1 - PAPER_IN.y0) * BOARD.scale,
};

// Сцены рисуются на виртуальной сцене 1080x1180 и масштабируются в лист.
export const STAGE = {w: 1080, h: 1180};
export const STAGE_SCALE = Math.min((PAPER.w - 40) / STAGE.w, (PAPER.h - 40) / STAGE.h);
export const CONTENT = {top: 0, bottom: STAGE.h};

// Под листом: субтитры, ниже у самого края кадра — аватар.
export const SUB_TOP = 1150;
export const AVATAR = {scale: 0.73, cut: 1190}; // строка картинки аватара (с полями наклейки), которая приходится на низ кадра

export const FONT = 'Manrope';

for (const weight of ['500', '700', '800']) {
	for (const subset of ['cyrillic', 'latin']) {
		loadFont({family: FONT, url: staticFile(`fonts/manrope-${subset}-${weight}-normal.woff2`), weight});
	}
}

// Шрифты для букв «из газеты» — у каждой буквы свой.
export const RANSOM_FONTS = [
	{family: 'R Playfair', file: 'playfair-display-cyrillic-900-normal', weight: '900'},
	{family: 'R Oswald', file: 'oswald-cyrillic-700-normal', weight: '700'},
	{family: 'R Lobster', file: 'lobster-cyrillic-400-normal', weight: '400'},
	{family: 'R Russo', file: 'russo-one-cyrillic-400-normal', weight: '400'},
	{family: 'R Yeseva', file: 'yeseva-one-cyrillic-400-normal', weight: '400'},
	{family: 'R RubikMono', file: 'rubik-mono-one-cyrillic-400-normal', weight: '400'},
	{family: 'R PTSerif', file: 'pt-serif-cyrillic-700-italic', weight: '700', style: 'italic'},
	{family: 'R Unbounded', file: 'unbounded-cyrillic-900-normal', weight: '900'},
	{family: 'R Ruslan', file: 'ruslan-display-cyrillic-400-normal', weight: '400'},
];
for (const f of RANSOM_FONTS) {
	loadFont({family: f.family, url: staticFile(`fonts/ransom/${f.file}.woff2`), weight: f.weight, style: f.style ?? 'normal'});
}
