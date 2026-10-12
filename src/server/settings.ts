// Floor settings (data/settings.json). Today: which agents may use which hive capabilities.
import fs from 'node:fs';
import path from 'node:path';
import type { AgentInfo } from '../core/types.ts';

export type Scope = 'off' | 'master' | 'all';
export const SCOPES: Scope[] = ['off', 'master', 'all'];

/** Capabilities the user can grant to agents. Tools not listed here are always available. */
export const CAPABILITIES = {
  spawn: { label: 'Spawn agents', description: 'Create new teammates on the floor.', tools: ['spawn_agent'], default: 'all' },
  agents: {
    label: 'Manage agents',
    description: 'Start, stop, interrupt, hold and archive other agents.',
    tools: ['agent_start', 'agent_stop', 'agent_interrupt', 'agent_hold', 'agent_archive'],
    default: 'master',
  },
  mods: { label: 'Manage mods', description: 'List mods, turn them on or off, and build new ones from a sentence.', tools: ['mod_list', 'mod_enable', 'mod_create'], default: 'master' },
  ui: { label: 'Control the UI', description: 'Switch the layout or add a panel for everyone watching the floor.', tools: ['ui_layout', 'ui_add_panel'], default: 'master' },
} as const satisfies Record<string, { label: string; description: string; tools: readonly string[]; default: Scope }>;

export type Capability = keyof typeof CAPABILITIES;
export interface FloorSettings {
  capabilities: Record<Capability, Scope>;
}

const defaults = (): FloorSettings => ({
  capabilities: Object.fromEntries(Object.entries(CAPABILITIES).map(([k, c]) => [k, c.default])) as Record<Capability, Scope>,
});

export class Settings {
  private file: string;
  private value: FloorSettings;

  constructor(dataDir: string) {
    this.file = path.join(dataDir, 'settings.json');
    this.value = defaults();
    try {
      this.apply(JSON.parse(fs.readFileSync(this.file, 'utf8')));
    } catch {}
  }

  get(): FloorSettings {
    return structuredClone(this.value);
  }

  /** Merge a patch (unknown keys and bad values are ignored), save, and return the result. */
  set(patch: unknown): FloorSettings {
    this.apply(patch);
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    fs.writeFileSync(this.file, JSON.stringify(this.value, null, 2) + '\n');
    return this.get();
  }

  private apply(patch: any) {
    const caps = patch?.capabilities;
    if (!caps || typeof caps !== 'object') return;
    for (const k of Object.keys(CAPABILITIES) as Capability[]) if (SCOPES.includes(caps[k])) this.value.capabilities[k] = caps[k];
  }

  /** The capability that gates a tool, if any. */
  capabilityOf(tool: string): Capability | undefined {
    return (Object.keys(CAPABILITIES) as Capability[]).find((k) => (CAPABILITIES[k].tools as readonly string[]).includes(tool));
  }

  allowed(agent: AgentInfo | undefined, tool: string): boolean {
    const cap = this.capabilityOf(tool);
    if (!cap) return true;
    const scope = this.value.capabilities[cap];
    return scope === 'all' || (scope === 'master' && !!agent?.master);
  }
}
