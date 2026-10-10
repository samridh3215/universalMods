#!/usr/bin/env node
// Capture the real-UI stills used in the "how it works" part of the demo video.
//   UM_TOKEN=dev-local node marketing/video/capture-intro.mjs   (floor at http://127.0.0.1:4477)
// Writes marketing/video/captures/*.png at 1600x1000 CSS px, device scale 1.5 (2400x1500).
// Uses the same headless-Chrome-over-CDP approach as scripts/screenshots.mjs.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import WebSocket from 'ws';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, 'captures');
const URL_ = process.env.UM_URL ?? 'http://127.0.0.1:4477';
const TOKEN = process.env.UM_TOKEN ?? 'dev-local';
const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const state = await (await fetch(`${URL_}/api/state`, { headers: { 'x-um-token': TOKEN } })).json();
const orch = state.agents.find((a) => a.role === 'master orchestrator')?.id;
const builder = state.agents.find((a) => a.role === 'mod builder')?.id;
const hasCost = state.mods?.some((m) => m.id === 'cost-panel');

const openNewMod = (text) => `(async () => {
  const w = (m) => new Promise((r) => setTimeout(r, m));
  document.querySelector('.popover-wrap > button').click(); await w(400);
  document.querySelector('.new-mod-btn').click(); await w(400);
  const ta = document.querySelector('.new-mod textarea');
  Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(ta, ${JSON.stringify(text)});
  ta.dispatchEvent(new Event('input', { bubbles: true })); ta.blur();
})()`;

const P = (view, params, size) => ({ id: Math.random().toString(36).slice(2, 8), view, ...(params ? { params } : {}), ...(size ? { size } : {}) });
const C = (panes, size) => ({ id: Math.random().toString(36).slice(2, 8), ...(size ? { size } : {}), panes });

const shots = [
  // Beat 1: agents as tiles, then one clicked open into its live terminal.
  { file: 'tiles.png', layout: [C([P('grid', { mode: 'tabs', selected: null })])] },
  { file: 'terminal.png', layout: [C([P('grid', { mode: 'tabs', selected: orch })])] },
  // Beat 2: the hive, orchestrator + kanban + roadmap + agent graph.
  {
    file: 'hive.png',
    layout: [
      C([P('grid', { mode: 'tabs', selected: orch })], 1),
      C([P('kanban', null, 1.1), P('agent-graph', null, 1)], 1.15),
    ],
  },
  { file: 'roadmap.png', layout: [C([P('roadmap', { mode: 'flow' }, 1.4), P('kanban', null, 1)], 1.3), C([P('agent-graph')], 1)] },
  // Beat 3: a mod from one sentence. Before (form) and after (Cost panel hot-reloaded in).
  {
    file: 'newmod-form.png',
    layout: [C([P('roadmap', { mode: 'flow' })], 1.05), C([P('grid', { mode: 'tabs', ...(builder ? { selected: builder } : {}) })], 1)],
    after: openNewMod('A Cost panel: a bar chart of tokens per agent, highest first, with a warning above 200k'),
  },
  {
    file: 'newmod-cost.png',
    layout: [
      C([P('roadmap', { mode: 'flow' }, 1.3), ...(hasCost ? [P('cost-panel', null, 1)] : [])], 1.05),
      C([P('grid', { mode: 'tabs', ...(builder ? { selected: builder } : {}) })], 1),
    ],
  },
];

const port = 9334;
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'um-video-'));
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });
fs.mkdirSync(OUT, { recursive: true });
try {
  let page;
  for (let i = 0; i < 50 && !page; i++) {
    try { page = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === 'page'); } catch {}
    if (!page) await sleep(200);
  }
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => ws.on('open', r));
  let id = 0;
  const pending = new Map();
  ws.on('message', (m) => { const d = JSON.parse(m); if (d.id && pending.has(d.id)) pending.get(d.id)(d.result ?? d.error), pending.delete(d.id); });
  const send = (method, params = {}) => new Promise((r) => (pending.set(++id, r), ws.send(JSON.stringify({ id, method, params }))));
  const base = `${URL_}/?token=${encodeURIComponent(TOKEN)}`;
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 1000, deviceScaleFactor: 1.5, mobile: false });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }] });
  await send('Page.navigate', { url: base });
  await sleep(1500);
  const only = process.argv.slice(2);
  for (const s of shots) {
    if (only.length && !only.includes(s.file)) continue;
    // A private layout name so the user's saved layouts are untouched in their own browser.
    const name = 'video-' + s.file.replace('.png', '');
    await send('Runtime.evaluate', { expression: `localStorage.setItem('um.layouts', ${JSON.stringify(JSON.stringify({ [name]: s.layout }))}); localStorage.setItem('um.layout', ${JSON.stringify(name)}); true` });
    await send('Page.navigate', { url: base });
    await sleep(6000);
    if (s.after) { await send('Runtime.evaluate', { expression: s.after, awaitPromise: true }); await sleep(800); }
    const { data } = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUT, s.file), Buffer.from(data, 'base64'));
    console.log('saved', s.file);
  }
  ws.close();
} finally {
  await new Promise((r) => (chrome.once('exit', r), chrome.kill(), setTimeout(r, 3000)));
  try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch {}
}
