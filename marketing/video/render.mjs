#!/usr/bin/env node
// Render composition.html to video, frame by frame, with headless Chrome + ffmpeg.
//   node marketing/video/render.mjs                      -> universalmods-demo.mp4 (1920x1080, 30 fps, H.264)
//   node marketing/video/render.mjs --gif                -> universalmods-demo.gif (layout montage loop)
//   node marketing/video/render.mjs --still 3.2 poster.png
//   options: --from <s> --to <s> --out <file> --fps <n>
// Needs Google Chrome (override with CHROME=/path) and ffmpeg on PATH. Uses `ws` from the repo's node_modules.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import WebSocket from 'ws';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const has = (k) => argv.includes(k);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const port = 9335;
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'um-render-'));
const chrome = spawn(CHROME, ['--headless=new', '--hide-scrollbars', '--allow-file-access-from-files', '--force-color-profile=srgb', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });

try {
  let page;
  for (let i = 0; i < 50 && !page; i++) {
    try { page = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === 'page'); } catch {}
    if (!page) await sleep(200);
  }
  const ws = new WebSocket(page.webSocketDebuggerUrl, { maxPayload: 512 * 1024 * 1024 });
  await new Promise((r) => ws.on('open', r));
  let id = 0;
  const pending = new Map();
  ws.on('message', (m) => { const d = JSON.parse(m); if (d.id && pending.has(d.id)) pending.get(d.id)(d.result ?? d.error), pending.delete(d.id); });
  const send = (method, params = {}) => new Promise((r) => (pending.set(++id, r), ws.send(JSON.stringify({ id, method, params }))));
  const evalJs = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error('page error: ' + (r.exceptionDetails.exception?.description ?? r.exceptionDetails.text));
    return r.result?.value;
  };

  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: pathToFileURL(path.join(HERE, 'composition.html')).href + '?render' });
  await sleep(1500);
  await evalJs('window.ready.then(() => true)');
  const T = await evalJs('JSON.stringify({ T: window.T, D: window.DURATION })').then(JSON.parse);
  console.log('duration', T.D.toFixed(2), 's', JSON.stringify(T.T));

  const shot = async (t, format = 'jpeg') => {
    await evalJs(`window.seek(${t}); new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(true))))`);
    const { data } = await send('Page.captureScreenshot', format === 'png' ? { format: 'png' } : { format: 'jpeg', quality: 95 });
    return Buffer.from(data, 'base64');
  };

  if (has('--stills')) {
    // --stills 1,2.5,9 <dir>: contact frames for checking the cut.
    const dir = path.resolve(argv[argv.indexOf('--stills') + 2] ?? '.');
    fs.mkdirSync(dir, { recursive: true });
    for (const t of opt('--stills').split(',').map(Number)) fs.writeFileSync(path.join(dir, `f_${t.toFixed(2)}.jpg`), await shot(t));
    console.log('saved stills to', dir);
  } else if (has('--still')) {
    const t = parseFloat(opt('--still'));
    const out = path.resolve(HERE, argv[argv.indexOf('--still') + 2] ?? 'poster.png');
    fs.writeFileSync(out, await shot(t, 'png'));
    console.log('saved', out);
  } else {
    const gif = has('--gif');
    const fps = parseFloat(opt('--fps', gif ? '10' : '30'));
    const from = parseFloat(opt('--from', gif ? String(T.T.mont[0] + 0.02) : '0'));
    const to = parseFloat(opt('--to', gif ? String(Math.min(T.T.mont[1], from + 11.9)) : String(T.D)));
    const out = path.resolve(HERE, opt('--out', gif ? 'universalmods-demo.gif' : 'universalmods-demo.mp4'));
    const frames = Math.round((to - from) * fps);
    const enc = gif
      ? ['-vf', 'scale=600:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=3:diff_mode=rectangle', '-loop', '0', out]
      : ['-vf', 'scale=in_range=full:out_range=tv,format=yuv420p', '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-c:v', 'libx264', '-preset', 'slow', '-crf', '21', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-movflags', '+faststart', '-an', out];
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-', ...enc], { stdio: ['pipe', 'inherit', 'inherit'] });
    const t0 = Date.now();
    for (let f = 0; f < frames; f++) {
      const buf = await shot(from + f / fps);
      if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
      if (f % 150 === 0) console.log(`frame ${f}/${frames} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
    }
    ff.stdin.end();
    await new Promise((r) => ff.on('exit', r));
    console.log('saved', out, frames, 'frames');
  }
  ws.close();
} finally {
  await new Promise((r) => (chrome.once('exit', r), chrome.kill(), setTimeout(r, 3000)));
  try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch {}
}
