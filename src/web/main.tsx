import * as React from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import * as ReactDOM from 'react-dom';
import { createRoot } from 'react-dom/client';
import * as UM from './mod-api.ts';
import { App } from './shell.tsx';
import { connect, getState, onModsChanged, subscribe, token, toast } from './store.ts';

// Expose the SDK so client mods (bundled separately) share one React + one store.
(window as any).__UM__ = { ...UM, React, jsxRuntime, ReactDOM };

const loaded = new Map<string, number>();
let chain = Promise.resolve();

// Imports run one at a time so registerView() calls are attributed to the right mod.
// Browsers cache a failed dynamic import per URL, so retries use a fresh URL (&a=n);
// a version that keeps failing is reported once and not retried until it changes.
const failed = new Map<string, { version: number; attempts: number }>();

function loadMod(id: string, version: number) {
  const f = failed.get(id);
  if (f?.version === version && f.attempts >= 3) return;
  chain = chain.then(async () => {
    if (loaded.get(id) === version) return;
    const attempt = failed.get(id)?.version === version ? failed.get(id)!.attempts : 0;
    UM._internal.dropMod(id);
    UM._internal.setCurrentMod(id);
    try {
      await import(/* @vite-ignore */ `/mods/${encodeURIComponent(id)}/client.js?token=${encodeURIComponent(token)}&v=${version}&a=${attempt}`);
      loaded.set(id, version);
      failed.delete(id);
    } catch (e: any) {
      failed.set(id, { version, attempts: attempt + 1 });
      if (attempt + 1 >= 3) toast(`client mod ${id} failed to load: ${e.message}`, 'error');
      else setTimeout(() => loadMod(id, version), 800 * (attempt + 1));
    } finally {
      UM._internal.setCurrentMod(undefined);
    }
  });
}

function syncMods() {
  for (const m of getState().mods) {
    if (m.enabled && m.hasClient && !m.error) loadMod(m.id, m.version);
    else if (loaded.has(m.id)) {
      loaded.delete(m.id);
      UM._internal.dropMod(m.id);
    }
  }
}

// Toast only for real reloads, not the first load of a mod.
const seen = new Set<string>();
subscribe(() => {
  for (const m of getState().mods) if (m.enabled && m.version) seen.add(m.id);
  syncMods();
});
onModsChanged(({ changed, kind }) => {
  if (kind === 'loaded' && seen.has(changed)) toast(`mod ${changed} reloaded`, 'info', 'mods');
});
connect();
createRoot(document.getElementById('root')!).render(<App />);
