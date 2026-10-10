#!/usr/bin/env node
// Refresh docs/screenshots/*.png from a running floor (used by the README and GitHub Pages).
//   UM_TOKEN=<token> npm run screenshots          (default URL http://127.0.0.1:4477)
// Drives headless Chrome over the DevTools protocol so each shot can use its own layout,
// colour scheme and UI state. Needs Google Chrome (override with CHROME=/path/to/chrome).
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import WebSocket from 'ws';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'docs/screenshots');
const URL_ = process.env.UM_URL ?? 'http://127.0.0.1:4477';
const TOKEN = process.env.UM_TOKEN;
const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
if (!TOKEN) throw new Error('set UM_TOKEN to the floor token');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const state = await (await fetch(`${URL_}/api/state`, { headers: { 'x-um-token': TOKEN } })).json();
const builder = state.agents?.find((a) => a.role === 'mod builder')?.id;

/** Fill the "New mod" form so the shot shows the feature. */
const openNewMod = `(async () => {
  const w = (m) => new Promise((r) => setTimeout(r, m));
  document.querySelector('.popover-wrap > button').click(); await w(400);
  document.querySelector('.new-mod-btn').click(); await w(400);
  const ta = document.querySelector('.new-mod textarea');
  Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(ta, 'A standup digest that summarises what every agent did today and posts it to the board each evening');
  ta.dispatchEvent(new Event('input', { bubbles: true })); ta.blur();
})()`;

const shots = [
  { file: 'floor.png', layout: 'showcase', scheme: 'dark' },
  { file: 'roadmap-light.png', layout: 'showcase', scheme: 'light' },
  {
    file: 'roadmap.png',
    layout: 'newmod',
    scheme: 'dark',
    custom: [
      {
        id: 'n1',
        size: 1.05,
        panes: [
          { id: 'n1a', view: 'roadmap', size: 1.3, params: { mode: 'flow' } },
          // A mod the Mod Builder wrote from one sentence (shown when it exists on this floor).
          ...(state.mods?.some((m) => m.id === 'cost-panel') ? [{ id: 'n1b', view: 'cost-panel', size: 1 }] : []),
        ],
      },
      { id: 'n2', size: 1, panes: [{ id: 'n2a', view: 'grid', params: { mode: 'tabs', ...(builder ? { selected: builder } : {}) } }] },
    ],
    after: openNewMod,
  },
];

const port = 9333;
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'um-shots-'));
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });

try {
  let page;
  for (let i = 0; i < 50 && !page; i++) {
    try {
      page = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === 'page');
    } catch {}
    if (!page) await sleep(200);
  }
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => ws.on('open', r));
  let id = 0;
  const pending = new Map();
  ws.on('message', (m) => {
    const d = JSON.parse(m);
    if (d.id && pending.has(d.id)) pending.get(d.id)(d.result ?? d.error), pending.delete(d.id);
  });
  const send = (method, params = {}) => new Promise((r) => (pending.set(++id, r), ws.send(JSON.stringify({ id, method, params }))));

  const base = `${URL_}/?token=${encodeURIComponent(TOKEN)}`;
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 1000, deviceScaleFactor: 1.5, mobile: false });
  await send('Page.navigate', { url: base });
  await sleep(1500);
  for (const s of shots) {
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: s.scheme }] });
    const layouts = s.custom ? { [s.layout]: s.custom } : {};
    await send('Runtime.evaluate', {
      expression: `localStorage.setItem('um.layouts', ${JSON.stringify(JSON.stringify(layouts))}); localStorage.setItem('um.layout', ${JSON.stringify(s.layout)}); true`,
    });
    await send('Page.navigate', { url: base });
    await sleep(6000);
    if (s.after) {
      await send('Runtime.evaluate', { expression: s.after, awaitPromise: true });
      await sleep(800);
    }
    const { data } = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUT, s.file), Buffer.from(data, 'base64'));
    console.log('saved', path.relative(ROOT, path.join(OUT, s.file)));
  }
  ws.close();
} finally {
  // Let Chrome finish writing its profile before removing it.
  await new Promise((r) => (chrome.once('exit', r), chrome.kill(), setTimeout(r, 3000)));
  try {
    fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  } catch {}
}
