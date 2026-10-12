---
name: universalmods
description: Set up, run and drive a universalMods floor (a local web UI that runs a team of Codex or Claude Code agents in live terminals with hot-reloading mods). Use when the user wants to install or start universalMods, spawn or message floor agents, manage its kanban/board, or write a universalMods mod.
---

# universalMods

universalMods is a local web "floor" for running and steering a team of **Codex** or **Claude Code** agents. Each agent runs its real CLI in a live browser terminal, a permanent **Orchestrator** agent plans and delegates through a shared hive (kanban, board, messages), and every view, guard and agent tool is a hot-reloading **mod**.

Repository: https://github.com/samridh3215/universalMods

## Install and start a floor

Requires Node 20+ and `claude` (Claude Code) or `codex` installed and logged in.

```bash
git clone https://github.com/samridh3215/universalMods.git
cd universalMods && npm install
npm run dev -- --provider claude        # or: --provider codex
```

The server prints a URL with a per-run token: `http://127.0.0.1:4477/?token=<token>`. Tell the user to open it. Useful flags:

- `--data <dir>`: floor data directory (one platform per floor; use another dir for the other platform)
- `--workspace <dir>`: working directory for the master Orchestrator
- `--port <n>`, `--agent-mode stream` (headless JSON agents instead of live terminals)
- `UM_TOKEN=<token>` env: fix the token instead of a random one

Append `&layout=<name>` to the URL for a built-in layout: `showcase`, `mission`, `deepdive`, `dashboard`, `planner`, `arcade`, `zen`, `ops`, `plan`, `focus`, `roadmap`.

**Safety:** agents run with no permission limits (Claude `--dangerously-skip-permissions`, Codex full access). Keep the server on `127.0.0.1` and never share the token. See SECURITY.md.

## Drive a running floor over HTTP

Every call needs the header `x-um-token: <token>` (base URL `http://127.0.0.1:4477`).

| Action | Request |
|---|---|
| Floor state (agents, tasks, board, mods) | `GET /api/state` |
| Spawn an agent | `POST /api/agents` `{name, role?, model?, cwd?, worktree?, prompt?}` |
| Send / steer / interrupt | `POST /api/agents/:id/send` `{text}` · `/steer` `{text}` · `/interrupt` |
| Start / stop an agent's terminal | `POST /api/agents/:id/start` · `/kill` |
| Agent events / terminal buffer | `GET /api/agents/:id/events` · `GET /api/agents/:id/pty` |
| Kanban | `POST /api/tasks` `{title, detail?, assignee?}` · `PATCH /api/tasks/:id` `{status}` |
| Shared board (markdown) | `PUT /api/board` `{text}` |
| Message an agent | `POST /api/messages` `{to, text}` |
| Halt / resume everything | `POST /api/floor/halt` `{on: true\|false}` |
| Build a mod from a sentence | `POST /api/mod-builder` `{description, target: "floor"\|"project"}` |
| Agent permissions | `GET /api/settings` · `PUT /api/settings` `{capabilities: {spawn\|agents\|mods\|ui: "off"\|"master"\|"all"}}` |

Prefer messaging the **Orchestrator** (the agent with `master: true`) and letting it delegate.

Agents on the floor already have hive MCP tools (`list_agents`, `send_message`, `spawn_agent`, `task_*`, `board_*`, `ask_user`, plus tools added by mods). Depending on Settings they also get `agent_*` (start/stop/archive teammates), `mod_*` (list, toggle, build mods) and `ui_*` (switch layout, add a panel); by default only the Orchestrator has those.

## Write a mod

A mod is a folder in `mods/` (shared) or `<data>/mods/` (this floor only) and hot-reloads on save:

```
mods/my-mod/
  mod.json     { "id": "my-mod", "name": "My mod", "description": "…" }
  server.ts    // optional: hooks on floor events
  client.tsx   // optional: views for the browser
```

Server hooks use Claude-Code-style chains:

```ts
import type { Register } from 'universal-mods/server';
export const register: Register = (on) => {
  on('tool.call', ($, e, next) =>
    /rm -rf \//.test(String((e.input as any)?.command)) ? { decision: 'deny', reason: 'not here' } : next());
};
```

Client views: `registerView({ id, title, render })` from `'universal-mods'` (React; hooks `useFloor`, `useAgentEvents`, `useModChannel`). Agent tools: `$.tool.register({name, description, inputSchema}, handler)`.

Read `MODDING.md` in the repository for the full event list and `$` API, and use `mods/status`, `mods/kanban` and `mods/roadmap` as examples. After writing a mod, check `GET /api/state` → `mods[]` has no `error` for its id.
