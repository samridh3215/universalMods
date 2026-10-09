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
function loadMod(id: string, version: number) {
  chain = chain.then(async () => {
    if (loaded.get(id) === version) return;
    UM._internal.dropMod(id);
    UM._internal.setCurrentMod(id);
    try {
      await import(/* @vite-ignore */ `/mods/${encodeURIComponent(id)}/client.js?token=${encodeURIComponent(token)}&v=${version}`);
      loaded.set(id, version);
    } catch (e: any) {
      toast(`client mod ${id} failed: ${e.message}`, 'error');
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
