#!/usr/bin/env node
// Локальная копия программы html-video из песочницы Tropos (тот же вызов и порядок работы),
// чтобы проверять страницы роликов до отправки в процесс.
//
//   node tools/html-video.mjs page.html out.mp4 --size 1080x1920 --fps 30 --duration 38 [--audio voice.mp3]
//
// Папка страницы раздаётся по http://127.0.0.1 (fetch, decodeAudioData, @font-face работают).
// Порядок: ждём document.fonts.ready, картинки и window.READY; для каждого кадра — window.seek(t) и снимок.
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import path from 'node:path';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const {chromium} = require('playwright');

const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : def; };
const [page, out] = args;
const [W, H] = opt('size', '1080x1920').split('x').map(Number);
const fps = Number(opt('fps', '30'));
const duration = Number(opt('duration', '10'));
const audio = opt('audio');
if (!page || !out) { console.error('usage: html-video page.html out.mp4 --size WxH --fps N --duration S [--audio file]'); process.exit(2); }

const root = path.dirname(path.resolve(page));
const MIME = {'.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
	'.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.css': 'text/css'};
const server = createServer(async (req, res) => {
	try {
		const p = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
		if (!p.startsWith(root)) throw new Error('outside');
		res.writeHead(200, {'Content-Type': MIME[path.extname(p)] || 'application/octet-stream'});
		res.end(await readFile(p));
	} catch { res.writeHead(404); res.end(); }
}).listen(0, '127.0.0.1');
await new Promise((r) => server.once('listening', r));
const url = `http://127.0.0.1:${server.address().port}/${path.basename(page)}`;

const browser = await chromium.launch();
const tab = await browser.newPage({viewport: {width: W, height: H}, deviceScaleFactor: 1});
tab.on('pageerror', (e) => console.error('page error:', e.message));
await tab.goto(url, {waitUntil: 'load'});
await tab.evaluate(async () => {
	await document.fonts.ready;
	await Promise.all([...document.images].map((im) => (im.complete ? null : im.decode().catch(() => null))));
	if (window.READY) await window.READY;
});

const frames = Math.round(duration * fps);
const silent = audio ? [] : ['-an'];
const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
	...(audio ? ['-i', audio, '-map', '0:v', '-map', '1:a', '-af', 'apad', '-c:a', 'aac', '-b:a', '160k', '-shortest'] : silent),
	'-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out],
	{stdio: ['pipe', 'inherit', 'inherit']});

const t0 = Date.now();
for (let i = 0; i < frames; i++) {
	await tab.evaluate(async (t) => { if (window.seek) await window.seek(t); }, i / fps);
	const shot = await tab.screenshot({type: 'jpeg', quality: 92});
	if (!ff.stdin.write(shot)) await new Promise((r) => ff.stdin.once('drain', r));
	if (i % 150 === 0) console.error(`кадр ${i}/${frames}`);
}
ff.stdin.end();
await new Promise((r, j) => ff.on('close', (c) => (c === 0 ? r() : j(new Error(`ffmpeg ${c}`)))));
await browser.close();
server.close();
console.error(`готово: ${out}, ${frames} кадров за ${((Date.now() - t0) / 1000).toFixed(0)} с`);
