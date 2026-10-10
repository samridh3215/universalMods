// "New mod" from plain English: brief a Mod Builder agent to write it.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Floor } from './floor.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/**
 * Natural-language mod creation: brief a "Mod Builder" agent (reused if one exists)
 * to write the mod into the floor's mods folder or the project's mods/ folder.
 */
export async function createMod(floor: Floor, description: string, target: 'floor' | 'project' = 'floor') {
  if (!description.trim()) throw new Error('describe the mod you want');
  const dir = target === 'project' ? path.join(ROOT, 'mods') : path.join(floor.o.dataDir, 'mods');
  const brief = `Create a new universalMods mod from this description:
---
${description.trim()}
---

How mods work (read these first):
- ${path.join(ROOT, 'MODDING.md')}: the mod API (server hooks, $ context, client views, agent tools).
- Examples in ${path.join(ROOT, 'mods')}: status (small server mod), guard-example (tool guard), kanban and timeline (client views), roadmap (server + client + agent tools).
- Types: ${path.join(ROOT, 'src/core/types.ts')} (server) and ${path.join(ROOT, 'src/web/mod-api.ts')} (client SDK).

Rules:
- Write everything into a new folder ${dir}/<mod-id>/ (kebab-case id): mod.json {id, name, description} plus server.ts and/or client.tsx.
- Client code imports only from 'universal-mods' and 'react'. Server code imports types from 'universal-mods/server' and Node built-ins. No new npm packages.
- Do not modify any file outside ${dir}/<mod-id>/.
- The floor hot-reloads the mod as soon as you save. Verify it loaded: run
curl -s -H "x-um-token: $UM_TOKEN" "$UM_URL/api/state"
and check that the entry for your mod id in "mods" has no "error". If it does, fix it and check again until it is clean.
- Finish with a short summary: what the mod does and how to use it (which view to add from "+ Panel", commands, tools).`;
  const existing = floor.list().find((a) => a.role === 'mod builder' && a.status !== 'error');
  if (existing) {
    await floor.send(existing.id, brief, 'user');
    return { agent: existing.name, dir };
  }
  const a = await floor.spawn({ name: 'Mod Builder', role: 'mod builder', cwd: ROOT, prompt: brief }, 'user');
  return { agent: a.name, dir };
}
