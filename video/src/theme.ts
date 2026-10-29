import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

// Палитра собрана от аватара: тёмно-синий фон, кремовый текст, карамельный акцент (блики волос).
export const C = {
	bg: '#2d3a53',
	bgDeep: '#1d2639',
	text: '#f6f1ea',
	muted: '#9aa6be',
	accent: '#e9a56b',
	accentSoft: 'rgba(233,165,107,0.16)',
	card: 'rgba(255,255,255,0.06)',
	line: 'rgba(255,255,255,0.12)',
};

export const W = 1080;
export const H = 1920;
export const FPS = 30;

// Зона контента: выше субтитров и интерфейса Instagram.
export const CONTENT = {top: 200, bottom: 1250};
export const SUB_TOP = 1330;

export const FONT = 'Manrope';

for (const weight of ['500', '700', '800']) {
	for (const subset of ['cyrillic', 'latin']) {
		loadFont({
			family: FONT,
			url: staticFile(`fonts/manrope-${subset}-${weight}-normal.woff2`),
			weight,
		});
	}
}
