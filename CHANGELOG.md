# Changelog

All notable changes to universalMods. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/) (while it is `0.x`, minor versions may include breaking changes).

Cut a release with `npm run release -- <patch|minor|major>`; pushing the tag publishes a GitHub Release with that version's notes.

## [Unreleased]

### Added
- **Projects** (📁 in the top bar): a workspace folder plus reference files/folders and notes. Pick folders and files with the system dialog (macOS, Windows, Linux with zenity) or type a path. Assign agents to a project: they work in its workspace (optionally in their own git worktree) and their instructions list the references to read.
- New-agent form picks a **project** instead of a free-text working directory. Agent cards show their project.
- Hive tools `project_list` and `project_info`; `spawn_agent` takes `project` (teammates join the spawner's project by default); `agent_set_project` (Manage agents capability).
- API: `/api/projects` (GET/POST/PATCH/DELETE), `POST /api/agents/:id/project`, `POST /api/fs/pick`, `GET /api/fs/inspect`.

### Added
- **Settings page** (⚙ in the top bar): choose which agents may run the floor: *Off*, *Orchestrator* or *All agents* per capability. Saved per floor in `settings.json`; enforced on every tool call.
- **New hive tools** behind those settings: `agent_start` / `agent_stop` / `agent_interrupt` / `agent_hold` / `agent_archive`, `mod_list` / `mod_enable` / `mod_create`, and `ui_layout` / `ui_add_panel` (switch the layout or add a panel for everyone watching). Tell the Orchestrator "switch to the dashboard layout" or "build a mod that…" and it does it.
- `GET` / `PUT /api/settings`.

### Fixed
- Codex orchestrators now create persistent floor agents through Hive's `mcp__hive__spawn_agent`, instead of Codex's separate collaboration-chat spawner. Native Codex multi-agent delegation is disabled for floor sessions, and existing agents refresh their Hive connection and instructions when restarted.
- A Codex terminal that completes startup with an unrelated global MCP failure now becomes ready for floor messages instead of remaining stuck in `starting`.
- Live-terminal agents no longer stay "working" forever when the CLI can't run the turn. The floor watches the terminal for the provider's error lines (Claude: login expired / `Please run /login`, usage limit, low credit, API error; Codex: not logged in / 401, usage limit, `■` errors). When one appears and the CLI then goes quiet, the agent is marked `error` with a notice. Its queue is kept for the next send. Claude's "waiting for your input" notification also ends a turn that never got a Stop hook. An interrupt that no hook confirms still returns the agent to idle after 2.5s, and no longer aborts a turn that started after it.
- **Archive**, layout **Delete** and roadmap **Remove** did nothing in browsers that suppress `window.confirm()` (such as the Claude desktop preview pane). They now ask for a second click instead (`ConfirmButton`, also exported to client mods). **Save as…** names the layout in an inline field instead of `window.prompt()`, which those browsers don't support.
- An agent whose saved session the CLI no longer has (deleted, never persisted, or a floor moved from another machine) failed on every start with Codex's `no saved session found with ID …` (or Claude's equivalent). The floor now checks the CLI's session store before resuming and starts a fresh session with a notice when it's missing.

## [0.4.0] - 2026-10-12

### Added
- **Delete layouts**: a Delete button next to Save as… removes a saved layout; on a built-in it hides it instead (restore from the layout menu).
- Landing page: hero demo loop, animated layouts showcase (morphing pane wireframe + crossfading screenshots), scroll-reveal motion, plugin install step.
- Installable plugin: `.codex-plugin/plugin.json`, `.claude-plugin/plugin.json` + `marketplace.json`, and a `universalmods` skill for installing, running and driving a floor and writing mods.
- Six new built-in layouts: `mission`, `deepdive`, `dashboard`, `planner`, `arcade`, `zen` (with screenshots in `docs/screenshots/layouts/`).
- Launch kit: demo video (`marketing/video/`, re-renderable), brand images and naming report (`marketing/brand/`), new README hero and OG image.

### Security
- Added `SECURITY.md` (reporting + security model), Dependabot for npm and GitHub Actions, and pinned workflow actions to commit SHAs; CI runs with read-only permissions.
- Plugin security scan workflow (HOL `ai-plugin-scanner-action`) on every push and pull request.

## [0.3.0] - 2026-10-10

### Added
- **Live agent terminals**: agents run their CLI's real TUI (`claude` / `codex`) in a PTY streamed to xterm.js; type straight into it. Status, timeline and token usage come from CLI hooks. Claude's first-run folder-trust prompt is answered automatically. `--agent-mode stream` keeps the headless JSON mode.
- **Agent pane tiles**: a strip of agent tiles; click one and its terminal fills the pane, click again to collapse. Grid mode keeps cards, now collapsible to their header and focusable full-size.
- **Permanent master orchestrator**: every floor ensures an `Orchestrator` agent that plans, spawns and coordinates; it cannot be archived. `--workspace <dir>` sets its working directory.
- **LeetCode-style workspace**: resize panes by dragging dividers, drag a pane onto another pane's edge to dock it (or its centre to swap), collapse panes to their title bar, maximize any pane. **+ Panel** adds a view.
- **New mod from plain English**: 🧩 → ＋ New mod briefs a *Mod Builder* agent that writes the mod, checks it loads and hot-reloads it into the floor.
- **Markdown** rendering for agent replies, the board (Edit / Preview), task details, hive messages and questions (raw HTML disabled).
- **Kanban**: drag cards between columns; columns slide horizontally in narrow panes.
- `showcase` built-in layout and `npm run screenshots` to refresh `docs/screenshots`.
- Versioning: this changelog, `npm run release`, release and CI workflows, version shown in the top bar.

### Changed
- Mods & skills moved from a pane into a top-bar pop-over.
- Mod Builder briefs use project-relative paths.

### Fixed
- Token usage was double-counted on an agent's first turn after a restart.
- A layout with every pane collapsed went blank; collapsed panes now stack as title bars.
- A client mod that failed to load once re-toasted on every update; it now retries with a fresh URL and reports once.
- `node-pty`'s `spawn-helper` lost its execute bit on install (`postinstall` restores it).

## [0.2.0] - 2026-10-09

### Added
- **Roadmap mod**: Now / Next / Later / Shipped roadmap drafted by a PM agent, rendered as a live Mermaid flowchart with dependency arrows; progress follows kanban tasks tagged `[Rn]`.
- **Mod-registered agent tools**: `$.tool.register` gives every agent a new hive MCP tool.
- GitHub Pages landing page, README screenshots, MIT license.
- Colour pass: custom checkboxes, filter chips, agent avatars and status stripes, coloured kanban columns.
- Spawn agents from a **+** tile in the agent grid (replaces the spawner pane).
- `?layout=<name>` URL parameter.

## [0.1.0] - 2026-10-09

### Added
- Claude-Code-style mod runtime: `on(event, matcher?, ($, e, next) => …)` hooks with hot reload, server and client halves.
- Web floor for **Claude Code** (`claude -p` stream-json) or **Codex** (`codex app-server`), one platform per floor, with per-platform config adapters and no-limits defaults.
- Hive: shared kanban, plan board, agent-to-agent messages, `spawn_agent` and `ask_user` over a stdio MCP server.
- Hook bridge for `PreToolUse` guards; built-in grid, timeline, kanban/board, status and guard-example mods.

[Unreleased]: https://github.com/samridh3215/universalMods/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/samridh3215/universalMods/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/samridh3215/universalMods/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/samridh3215/universalMods/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/samridh3215/universalMods/releases/tag/v0.1.0
