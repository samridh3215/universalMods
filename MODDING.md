# Modding universalMods

A mod is a folder under `mods/`, `data/mods/` or any `--mods <dir>`. Any file you save under it **hot-reloads**, with no server restart.

```
mods/my-mod/
  mod.json        { "id", "name", "description", "enabled"?, "provider"?: "claude"|"codex", "options"? }
  server.ts       optional: hooks on the floor (Node, bundled by esbuild)
  client.tsx      optional: views / toolbar widgets for the browser
  skills/<name>/SKILL.md   optional: skills offered when spawning an agent (work on both platforms)
```

Setting `"provider"` restricts a mod to one platform's floors. Leave it out for both.

## Server half: hooks

The same chain semantics as Claude Code mods:

```ts
import type { Register } from 'universal-mods/server';

export const register: Register = (on, options) => {
  on('tool.call', { tool: /^(Bash|shell)$/ }, ($, e, next) => {
    if (String((e.input as any)?.command).includes('prod')) return { decision: 'deny', reason: 'not on prod' }; // answer it
    return next();                                    // or pass it on
  }).catch(($, e, next) => (next.called ? next() : { decision: 'deny', reason: 'guard crashed' })); // fail closed
};
```

How a hook can respond:
- **Answer** the event: return without calling `next`.
- **Rewrite** it: `next({ ...e, x })`.
- **Post-process** it: `const r = await next(e)`.
- If a hook throws, it is skipped, unless it has `.catch`.
- `e` is frozen.

The matcher is either an object (each key must equal the event's value, or pass a RegExp) or a function `(e) => boolean`.

### Events

| Event | Input → output | Use |
|---|---|---|
| `session.start` | floor booted / mod (re)loaded | register commands, start timers |
| `agent.spawn` | `{spec, by}` → `AgentInfo` | rewrite or veto spawns |
| `config.build` | `{provider, agent, spec, config}` → config | patch the per-platform config before it's written |
| `prompt.submit` | `{agentId, text, from}` → `{text}` or `null` | rewrite or drop prompts |
| `tool.call` | `{agentId, tool, input, source, provider}` → `{decision, reason?}` | guards (fed by PreToolUse hooks / Codex approvals) |
| `agent.event` | `{agent, event}` | every normalized stream event |
| `agent.status` / `agent.exit` | — | react to state changes |
| `message.send` | `HiveMessage` → `{delivered}` | route or filter agent↔agent messages |
| `task.add` / `task.update` / `board.update` | — | kanban/board policy |
| `classic.hook` | `{agentId, hookEventName, payload}` → hook JSON | raw Claude/Codex settings-file hooks |
| `command.run` | `{name, args, by}` → `{text}` | answer commands registered with `$.command.register` |
| `ui.press` | `{mod, key, payload}` | buttons in your client half (`floor.press(mod, key)`) |

### `$` (context)

| Area | API |
|---|---|
| Agents | `$.agent.list/get/spawn/send/steer/interrupt/kill/hold/events` |
| Hive | `$.hive.tasks/addTask/updateTask/board/setBoard/message` |
| UI | `$.ui.toast(text, level)`, `$.ui.status(text)` (top bar), `$.ui.publish(channel, data)` (to your client) |
| State | `$.state.get/set` (session), `$.store.get/set` (persisted per mod) |
| Timers and commands | `$.clock.every/after` (cleared on reload), `$.command.register(name, description)` |
| Agent tools | `$.tool.register({ name, description, inputSchema }, handler)` gives every agent a new hive MCP tool |
| Info | `$.log`, `$.provider`, `$.dataDir` |

### Giving agents new tools

A mod can extend what agents can do, not just what you see. Register the tool in `session.start`:

```ts
on('session.start', ($, _e, next) => {
  $.tool.register(
    { name: 'release_notes', description: 'Append a line to the release notes', inputSchema: { type: 'object', properties: { line: { type: 'string' } }, required: ['line'] } },
    (args, caller) => {
      const notes = $.store.get<string[]>('notes', []);
      $.store.set('notes', [...notes, `${caller.agentName}: ${args.line}`]);
      return 'added';
    },
  );
  return next();
});
```

- Claude sees the tool as `mcp__hive__release_notes`; Codex sees it as `hive.release_notes`.
- Return a string, or any JSON value.
- Tools disappear when the mod is disabled.
- Running agents pick up new tools the next time they start (Stop, then send).
- `mods/roadmap` is a full example: it registers `roadmap_get/_set/_upsert/_move/_remove`, keeps state in `$.store`, pushes it live with `$.ui.publish`, and renders it as a Mermaid flowchart.

## Client half: views

```tsx
import { registerView, useFloor, useAgentEvents, useModChannel, floor, EventLine } from 'universal-mods';

registerView({
  id: 'costs',
  title: 'Costs',
  render: ({ params, setParams }) => <Costs />, // params persist with the pane in the saved layout
});
```

| SDK export | What it gives you |
|---|---|
| `useFloor(select?)` | agents, tasks, board, messages, mods, skills, status, questions, provider, halted |
| `useAgentEvents(id?)` | history + live normalized events (all agents if `id` is omitted) |
| `useModChannel(mod, channel)` | latest value a server mod sent with `$.ui.publish` |
| `floor.*` | spawn/send/steer/interrupt/kill/hold/archive/config, tasks/board/messages, `press`, `command`, `halt` |
| Components | `EventLine`, `StatusBadge`, `fmtUsage` |
| Other | `registerToolbar({ id, render })`, `toast(text)` |

Once a view is registered, users can place it in any pane of any layout. See `mods/` for working examples:
- `status`: a server mod in about 40 lines.
- `guard-example`: a fail-closed tool guard.
