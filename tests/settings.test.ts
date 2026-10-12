import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { handleMcpTool, hiveTools } from '../src/server/mcp-tools.ts';
import { Settings } from '../src/server/settings.ts';

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'um-settings-'));
const master = { id: 'o', name: 'Orchestrator', master: true } as any;
const worker = { id: 'w', name: 'Jim' } as any;

describe('Settings', () => {
  it('defaults: everyone spawns, only the orchestrator manages agents/mods/UI', () => {
    const s = new Settings(tmp());
    expect(s.allowed(worker, 'spawn_agent')).toBe(true);
    expect(s.allowed(worker, 'agent_stop')).toBe(false);
    expect(s.allowed(master, 'agent_stop')).toBe(true);
    expect(s.allowed(master, 'mod_create')).toBe(true);
    expect(s.allowed(worker, 'task_add')).toBe(true); // ungated tools are always on
  });

  it('persists valid scopes and ignores bad input', () => {
    const dir = tmp();
    new Settings(dir).set({ capabilities: { mods: 'off', ui: 'all', spawn: 'everyone', nope: 'all' } });
    const s = new Settings(dir);
    expect(s.get().capabilities).toMatchObject({ mods: 'off', ui: 'all', spawn: 'all' });
    expect(s.allowed(master, 'mod_list')).toBe(false);
    expect(s.allowed(worker, 'ui_layout')).toBe(true);
  });
});

describe('hive tool gating', () => {
  const floorWith = (settings: Settings) =>
    ({ settings, modTools: new Map(), get: (id: string) => [master, worker].find((a) => a.id === id), list: () => [master, worker] }) as any;

  it('hides tools an agent may not use', () => {
    const f = floorWith(new Settings(tmp()));
    const names = (id: string) => hiveTools(f, id).map((t) => t.name);
    expect(names('w')).not.toContain('agent_stop');
    expect(names('o')).toContain('agent_stop');
    expect(names('w')).toContain('board_read');
  });

  it('refuses a disabled tool even if the agent calls it', async () => {
    const s = new Settings(tmp());
    s.set({ capabilities: { spawn: 'off' } });
    await expect(handleMcpTool(floorWith(s), 'spawn_agent', 'o', { name: 'x' })).rejects.toThrow(/turned off/);
  });
});
