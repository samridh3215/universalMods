// Client-side floor state: initial /api/state snapshot + live WebSocket updates.
import type { AgentInfo, HiveMessage, StampedEvent, Task } from '../core/types.ts';

export interface ModRow {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  error?: string;
  hasClient: boolean;
  hasServer: boolean;
  version: number;
}

export interface FloorState {
  ready: boolean;
  /** Set when the server rejects our token (or we have none). */
  authError?: string;
  setup?: { dataDir: string; checks: Record<string, { ok: boolean; version?: string; error?: string }> };
  provider?: 'claude' | 'codex';
  check?: { ok: boolean; version?: string; error?: string };
  halted: boolean;
  connected: boolean;
  agents: AgentInfo[];
  tasks: Task[];
  board: string;
  messages: HiveMessage[];
  mods: ModRow[];
  skills: { name: string; description: string; source: string }[];
  status: Record<string, string>;
  questions: { id: string; agentId: string; question: string; ts: number }[];
  commands: { name: string; mod: string; description: string }[];
  toasts: { id: number; text: string; level: string; mod: string }[];
  queued: Record<string, number>;
}

function storedToken(): string {
  try {
    return localStorage.getItem('um.token') ?? '';
  } catch {
    return '';
  }
}

export let token = new URLSearchParams(location.search).get('token') ?? storedToken();
try {
  if (token) localStorage.setItem('um.token', token);
} catch {}

/** Use a token typed by the user, remember it, and reconnect. */
export function setToken(t: string) {
  token = t.trim();
  try {
    localStorage.setItem('um.token', token);
  } catch {}
  const url = new URL(location.href);
  url.searchParams.set('token', token);
  history.replaceState(null, '', url);
  set({ authError: undefined });
  void refresh().catch(() => {});
}

let state: FloorState = {
  ready: false,
  halted: false,
  connected: false,
  agents: [],
  tasks: [],
  board: '',
  messages: [],
  mods: [],
  skills: [],
  status: {},
  questions: [],
  commands: [],
  toasts: [],
  queued: {},
};
const listeners = new Set<() => void>();
const eventListeners = new Set<(e: StampedEvent) => void>();
const channelListeners = new Set<(m: { mod: string; channel: string; data: unknown }) => void>();
const modListeners = new Set<(m: { changed: string; kind: string }) => void>();

export const getState = () => state;
export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => void listeners.delete(fn);
}
export const onEvent = (fn: (e: StampedEvent) => void) => (eventListeners.add(fn), () => void eventListeners.delete(fn));
export const onChannel = (fn: (m: { mod: string; channel: string; data: unknown }) => void) => (channelListeners.add(fn), () => void channelListeners.delete(fn));
export const onModsChanged = (fn: (m: { changed: string; kind: string }) => void) => (modListeners.add(fn), () => void modListeners.delete(fn));

function set(patch: Partial<FloorState>) {
  state = { ...state, ...patch };
  for (const l of listeners) l();
}

let toastId = 0;
export function toast(text: string, level = 'info', mod = 'shell') {
  const id = ++toastId;
  set({ toasts: [...state.toasts, { id, text, level, mod }].slice(-5) });
  setTimeout(() => set({ toasts: state.toasts.filter((t) => t.id !== id) }), 6000);
}

export async function api<T = any>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const r = await fetch(path, {
    method,
    headers: { 'content-type': 'application/json', 'x-um-token': token },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const j = await r.json().catch(() => ({}));
  if (r.status === 401) {
    set({ ready: true, authError: token ? 'That token was rejected by the server.' : 'This floor needs its access token.' });
    throw new Error('unauthorized');
  }
  if (!r.ok) {
    toast(j.error ?? `HTTP ${r.status}`, 'error');
    throw new Error(j.error ?? `HTTP ${r.status}`);
  }
  return j as T;
}

export async function refresh() {
  const s = await api('/api/state');
  if (s.setup) return set({ ready: true, authError: undefined, setup: s, provider: undefined });
  set({
    ready: true,
    authError: undefined,
    setup: undefined,
    provider: s.floor.provider,
    check: s.floor.check,
    halted: s.floor.halted,
    agents: s.agents,
    tasks: s.tasks,
    board: s.board,
    messages: s.messages,
    mods: s.mods,
    skills: s.skills,
    status: s.status,
    questions: s.questions,
    commands: s.commands,
  });
}

function handle(m: any) {
  switch (m.type) {
    case 'agent': {
      const others = state.agents.filter((a) => a.id !== m.agent.id);
      const agents = m.agent.archived ? others : [...state.agents.map((a) => (a.id === m.agent.id ? m.agent : a)), ...(state.agents.some((a) => a.id === m.agent.id) ? [] : [m.agent])];
      return set({ agents, queued: m.queued !== undefined ? { ...state.queued, [m.agent.id]: m.queued } : state.queued });
    }
    case 'event':
      for (const l of eventListeners) l(m as StampedEvent);
      return;
    case 'tasks':
      return set({ tasks: m.tasks });
    case 'board':
      return set({ board: m.text });
    case 'message':
      return set({ messages: [...state.messages, m.message].slice(-500) });
    case 'mods':
      // Listeners run before the state update so they can compare with the previous mod list.
      for (const l of modListeners) l(m);
      return set({ mods: m.mods });
    case 'toast':
      return toast(m.text, m.level, m.mod);
    case 'status':
      return set({ status: m.status });
    case 'questions':
      return set({ questions: m.questions });
    case 'commands':
      return set({ commands: m.commands });
    case 'floor':
      return set({ halted: m.halted });
    case 'publish':
      for (const l of channelListeners) l(m);
      return;
    case 'reload':
      return void refresh();
  }
}

let wsStarted = false;
export function connect() {
  if (!wsStarted) {
    wsStarted = true;
    // Load state over HTTP right away, so auth problems surface even if the socket never opens.
    void refresh().catch(() => {});
  }
  if (!token) return void setTimeout(connect, 1500);
  const ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws?token=${encodeURIComponent(token)}`);
  ws.onopen = () => {
    set({ connected: true });
    void refresh();
  };
  ws.onmessage = (ev) => handle(JSON.parse(ev.data));
  ws.onclose = () => {
    set({ connected: false });
    setTimeout(connect, 1500);
  };
}
