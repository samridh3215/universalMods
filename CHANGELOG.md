# Changelog

All notable changes to universalMods. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/) (while it is `0.x`, minor versions may include breaking changes).

Cut a release with `npm run release -- <patch|minor|major>`; pushing the tag publishes a GitHub Release with that version's notes.

## [Unreleased]

### Security
- Added `SECURITY.md` (reporting + security model), Dependabot for npm and GitHub Actions, and pinned workflow actions to commit SHAs; CI runs with read-only permissions.

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

[Unreleased]: https://github.com/samridh3215/universalMods/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/samridh3215/universalMods/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/samridh3215/universalMods/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/samridh3215/universalMods/releases/tag/v0.1.0
