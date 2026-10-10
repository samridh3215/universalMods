# Security Policy

## Supported versions

Security fixes are made on the latest release (see [releases](https://github.com/samridh3215/universalMods/releases)). Please upgrade before reporting.

## Reporting a vulnerability

Please **do not open a public issue**. Report privately via GitHub's [private vulnerability reporting](https://github.com/samridh3215/universalMods/security/advisories/new). Include steps to reproduce, the affected version and the impact. You should get a response within a few days.

## Security model (read this before running it)

universalMods deliberately runs coding agents with **no permission limits** by default:

- Claude Code agents start with `--dangerously-skip-permissions`; Codex agents use `danger-full-access` with approval `never`.
- Agents can therefore do anything your user account can: read and write files, run commands, use the network.

What protects you:

- The server binds to `127.0.0.1` and every API call and WebSocket requires a per-run random token (`UM_TOKEN` to fix it). Exposing it with `--host 0.0.0.0` gives anyone holding the token control of your machine; only do that inside a sandbox, container or VM.
- Your global `~/.claude` and `~/.codex` configuration is never modified; per-agent settings live in the floor's data directory.
- Guards are opt-in mods: a `tool.call` hook can deny commands on both platforms (see `mods/guard-example`). Agent-written text is rendered as Markdown with raw HTML disabled.
- Mods are code: only install mods you trust, and review mods written by the Mod Builder agent before sharing them.

Run untrusted tasks in an isolated environment (container, VM or throwaway user account).
