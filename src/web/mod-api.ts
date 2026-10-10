// The client mod SDK. Client mods `import { registerView, useFloor, floor } from 'universal-mods'`;
// at runtime that import resolves to window.__UM__ (this module's exports).
import * as React from 'react';
import { useEffect, useState, useSyncExternalStore } from 'react';
import type { SpawnSpec, StampedEvent, Task } from '../core/types.ts';
import { api, getState, onChannel, onEvent, subscribe, toast, type FloorState } from './store.ts';

export type { AgentEvent, AgentInfo, StampedEvent, Task, HiveMessage } from '../core/types.ts';
export type { FloorState } from './store.ts';

export interface ViewProps {
  /** Per-pane params (e.g. which agent to focus); persisted with the layout. */
  params: Record<string, any>;
  setParams(p: Record<string, any>): void;
}

export interface ViewDef {
  id: string;
  title: string;
  render: (props: ViewProps) => React.ReactNode;
  mod?: string;
}

export interface ToolbarItem {
  id: string;
  render: () => React.ReactNode;
  mod?: string;
}

const registry = { views: new Map<string, ViewDef>(), toolbar: new Map<string, ToolbarItem>(), version: 0 };
const regListeners = new Set<() => void>();
let currentMod: string | undefined;

export const _internal = {
  registry,
  setCurrentMod(m: string | undefined) {
    currentMod = m;
  },
  dropMod(mod: string) {
    for (const [k, v] of registry.views) if (v.mod === mod) registry.views.delete(k);
    for (const [k, v] of registry.toolbar) if (v.mod === mod) registry.toolbar.delete(k);
    bump();
  },
  subscribe(fn: () => void) {
    regListeners.add(fn);
    return () => void regListeners.delete(fn);
  },
};

function bump() {
  registry.version++;
  for (const l of regListeners) l();
}

/** Register (or replace, on hot reload) a view that users can place in any pane. */
export function registerView(v: ViewDef) {
  registry.views.set(v.id, { ...v, mod: v.mod ?? currentMod });
  bump();
}

/** Register a widget for the top bar. */
export function registerToolbar(t: ToolbarItem) {
  registry.toolbar.set(t.id, { ...t, mod: t.mod ?? currentMod });
  bump();
}

/** Whole-floor state (agents, tasks, board, messages, mods, …), re-rendering on change. */
export function useFloor<T = FloorState>(select?: (s: FloorState) => T): T {
  const s = useSyncExternalStore(subscribe, getState);
  return select ? select(s) : (s as unknown as T);
}

/** History + live events for one agent (or all agents when id is omitted). */
export function useAgentEvents(agentId?: string, limit = 400): StampedEvent[] {
  const [events, setEvents] = useState<StampedEvent[]>([]);
  useEffect(() => {
    let alive = true;
    let buf: StampedEvent[] = [];
    const ids = agentId ? [agentId] : getState().agents.map((a) => a.id);
    Promise.all(ids.map((id) => api<StampedEvent[]>(`/api/agents/${encodeURIComponent(id)}/events?limit=${limit}`).catch(() => [])))
      .then((all) => {
        if (!alive) return;
        buf = mergeEvents(all.flat().concat(buf)).slice(-limit);
        setEvents(buf);
      });
    const off = onEvent((e) => {
      if (agentId && e.agentId !== agentId) return;
      buf = appendEvent(buf, e).slice(-limit);
      setEvents(buf);
    });
    return () => {
      alive = false;
      off();
    };
  }, [agentId, limit]);
  return events;
}

function mergeEvents(list: StampedEvent[]) {
  const seen = new Set<number>();
  const full = new Set(list.filter((e) => e.event.kind === 'text' && !e.event.delta && e.event.itemId).map((e) => (e.event as any).itemId));
  return list
    .filter((e) => (seen.has(e.seq) ? false : (seen.add(e.seq), true)))
    .filter((e) => !(e.event.kind === 'text' && e.event.delta && full.has(e.event.itemId)))
    .sort((a, b) => a.seq - b.seq);
}

/** Streaming text deltas are folded into one growing text event per item. */
function appendEvent(buf: StampedEvent[], e: StampedEvent): StampedEvent[] {
  const ev = e.event;
  if (ev.kind === 'text') {
    const i = buf.findIndex((x) => x.event.kind === 'text' && x.event.itemId && x.event.itemId === ev.itemId && x.agentId === e.agentId);
    if (i >= 0) {
      const prev = buf[i].event as typeof ev;
      const next = { ...buf[i], event: { ...prev, text: ev.delta ? prev.text + ev.text : ev.text, delta: ev.delta } };
      return [...buf.slice(0, i), next, ...buf.slice(i + 1)];
    }
  }
  return [...buf, e];
}

/** Latest value a server mod published with $.ui.publish(channel, data). */
export function useModChannel<T = unknown>(mod: string, channel: string, init?: T): T | undefined {
  const [v, setV] = useState<T | undefined>(init);
  useEffect(() => onChannel((m) => m.mod === mod && m.channel === channel && setV(m.data as T)), [mod, channel]);
  return v;
}

const enc = encodeURIComponent;

/** Imperative floor controls. */
export const floor = {
  spawn: (spec: SpawnSpec) => api('/api/agents', 'POST', spec),
  send: (id: string, text: string) => api(`/api/agents/${enc(id)}/send`, 'POST', { text }),
  steer: (id: string, text: string) => api(`/api/agents/${enc(id)}/steer`, 'POST', { text }),
  interrupt: (id: string) => api(`/api/agents/${enc(id)}/interrupt`, 'POST', {}),
  kill: (id: string) => api(`/api/agents/${enc(id)}/kill`, 'POST', {}),
  /** Launch an agent's terminal without sending a prompt. */
  start: (id: string) => api(`/api/agents/${enc(id)}/start`, 'POST', {}),
  hold: (id: string, held: boolean) => api(`/api/agents/${enc(id)}/hold`, 'POST', { held }),
  archive: (id: string) => api(`/api/agents/${enc(id)}/archive`, 'POST', {}),
  config: (id: string) => api(`/api/agents/${enc(id)}/config`),
  addTask: (t: Partial<Task> & { title: string }) => api('/api/tasks', 'POST', t),
  updateTask: (id: string, patch: Partial<Task>) => api(`/api/tasks/${enc(id)}`, 'PATCH', patch),
  deleteTask: (id: string) => api(`/api/tasks/${enc(id)}`, 'DELETE', {}),
  setBoard: (text: string) => api('/api/board', 'PUT', { text }),
  message: (to: string, text: string) => api('/api/messages', 'POST', { to, text }),
  answer: (id: string, answer: string) => api(`/api/questions/${enc(id)}`, 'POST', { answer }),
  halt: (on: boolean) => api('/api/floor/halt', 'POST', { on }),
  /** Have a Mod Builder agent write a new mod from a plain-English description. */
  createMod: (description: string, target: 'floor' | 'project' = 'floor') => api<{ agent: string; dir: string }>('/api/mod-builder', 'POST', { description, target }),
  setModEnabled: (id: string, enabled: boolean) => api(`/api/mods/${enc(id)}`, 'POST', { enabled }),
  /** Fire a ui.press event at a server mod's hooks. */
  press: (mod: string, key: string, payload?: unknown) => api(`/api/mods/${enc(mod)}/press`, 'POST', { key, payload }),
  command: (name: string, args = '') => api(`/api/commands/${enc(name)}`, 'POST', { args }),
};

export { React, toast };
export { EventLine, StatusBadge, fmtUsage } from './components.tsx';
export { AgentTerminal } from './terminal.tsx';
export { Markdown } from './markdown.tsx';
