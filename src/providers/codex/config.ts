// Codex config adapter.
// Codex reads TOML (~/.codex/config.toml) and per-thread params. To keep the
// user's CODEX_HOME (auth, models, MCP servers) intact we never write there:
// per-agent settings become `-c key=<toml>` overrides on the agent's
// app-server process plus `thread/start` params. A config.toml mirror is
// written to the agent dir purely for inspection.
import path from 'node:path';
import type { ConfigInput } from '../types.ts';
import { linkSkills, toTomlDoc, writeFile } from '../util.ts';

const HOOK_EVENTS = ['PreToolUse', 'PostToolUse', 'UserPromptSubmit', 'Stop', 'SubagentStop', 'SessionStart', 'PreCompact'];

export function buildCodexConfig(i: ConfigInput): Record<string, any> {
  const hook = (event: string) => [{ ...(event.endsWith('ToolUse') ? { matcher: '.*' } : {}), hooks: [{ type: 'command', command: `${i.hookCommand} ${event}`, timeout: 600 }] }];
  return {
    // Passed to `thread/start` (and `thread/resume`).
    thread: {
      model: i.spec.model ?? null,
      // "No limits": never ask, full disk + network access.
      approvalPolicy: 'never',
      sandbox: 'danger-full-access',
      developerInstructions: i.instructions,
    },
    turn: {
      effort: i.spec.effort ?? null,
    },
    // `-c key=value` overrides for the app-server process (dotted keys, TOML values).
    overrides: {
      'mcp_servers.hive': { command: i.mcp.command, args: i.mcp.args, env: i.mcp.env, tool_timeout_sec: 3600 },
      'features.hooks': true,
      'features.multi_agent': true,
      ...Object.fromEntries(HOOK_EVENTS.map((e) => [`hooks.${e}`, hook(e)])),
    } as Record<string, unknown>,
    // Hooks we add are vetted by us; skip Codex's interactive /hooks trust review.
    bypassHookTrust: true,
    // Codex discovers skills in <cwd>/.agents/skills (walking up to the repo root).
    skills: i.skills,
    skillsDir: '.agents/skills',
    extraArgs: [] as string[],
  };
}

export function writeCodexConfig(i: ConfigInput, c: Record<string, any>): string[] {
  const dir = path.join(i.agentDir, 'codex');
  const files = [
    writeFile(path.join(dir, 'config.toml'), `# universalMods: applied as -c overrides (not read by Codex directly)\n` + toTomlDoc(c.overrides)),
    writeFile(path.join(dir, 'thread.json'), JSON.stringify({ thread: c.thread, turn: c.turn }, null, 2)),
    writeFile(path.join(dir, 'AGENTS.md'), c.thread.developerInstructions ?? ''),
  ];
  if (c.skills?.length) files.push(...linkSkills(c.skills, path.join(i.agent.cwd, c.skillsDir)));
  return files;
}
