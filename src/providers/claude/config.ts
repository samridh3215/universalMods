// Claude Code config adapter.
// Claude keeps config in JSON settings files + CLI flags; we never touch the
// user's ~/.claude — everything is passed per agent via --settings,
// --mcp-config and --plugin-dir, so global auth/settings still apply.
import path from 'node:path';
import type { ConfigInput } from '../types.ts';
import { linkSkills, writeFile } from '../util.ts';

const HOOK_EVENTS = ['PreToolUse', 'PostToolUse', 'UserPromptSubmit', 'Stop', 'SubagentStop', 'Notification', 'PreCompact', 'SessionStart'];

export function buildClaudeConfig(i: ConfigInput): Record<string, any> {
  const hook = (event: string) => [{ matcher: event.endsWith('ToolUse') ? '.*' : undefined, hooks: [{ type: 'command', command: `${i.hookCommand} ${event}`, timeout: 600 }] }];
  return {
    cli: {
      model: i.spec.model,
      effort: i.spec.effort,
      // "No limits": skip every permission check. Mods can still deny via the PreToolUse bridge.
      dangerouslySkipPermissions: true,
      appendSystemPrompt: i.instructions,
      extraArgs: [] as string[],
    },
    settings: {
      permissions: { defaultMode: 'bypassPermissions' },
      hooks: Object.fromEntries(HOOK_EVENTS.map((e) => [e, hook(e)])),
      env: {},
    },
    mcp: {
      mcpServers: { hive: { type: 'stdio', command: i.mcp.command, args: i.mcp.args, env: i.mcp.env } },
    },
    /** Extra subagent definitions passed with --agents. */
    agents: {} as Record<string, unknown>,
    skills: i.skills,
  };
}

export function claudePaths(agentDir: string) {
  const dir = path.join(agentDir, 'claude');
  return {
    dir,
    settings: path.join(dir, 'settings.json'),
    mcp: path.join(dir, 'mcp.json'),
    plugin: path.join(dir, 'plugin'),
    instructions: path.join(dir, 'CLAUDE.md'),
  };
}

export function writeClaudeConfig(i: ConfigInput, c: Record<string, any>): string[] {
  const p = claudePaths(i.agentDir);
  const files = [
    writeFile(p.settings, JSON.stringify(c.settings, null, 2)),
    writeFile(p.mcp, JSON.stringify(c.mcp, null, 2)),
    writeFile(p.instructions, c.cli.appendSystemPrompt ?? ''),
    // Skills ship as a session-only plugin so nothing is written into the user's repo.
    writeFile(
      path.join(p.plugin, '.claude-plugin', 'plugin.json'),
      JSON.stringify({ name: `um-${i.agent.id}`, version: '0.0.0', description: 'universalMods per-agent skills' }, null, 2),
    ),
  ];
  files.push(...linkSkills(c.skills ?? [], path.join(p.plugin, 'skills')));
  return files;
}

/** CLI args for `claude -p` in bidirectional stream-json mode. */
export function claudeArgs(agentDir: string, c: Record<string, any>, session: { id: string; resume: boolean }): string[] {
  const p = claudePaths(agentDir);
  const a = ['-p', '--input-format', 'stream-json', '--output-format', 'stream-json', '--verbose'];
  a.push('--settings', p.settings, '--mcp-config', p.mcp, '--plugin-dir', p.plugin);
  if (c.cli.dangerouslySkipPermissions) a.push('--dangerously-skip-permissions');
  if (c.cli.model) a.push('--model', c.cli.model);
  if (c.cli.effort) a.push('--effort', c.cli.effort);
  if (c.cli.appendSystemPrompt) a.push('--append-system-prompt', c.cli.appendSystemPrompt);
  if (c.agents && Object.keys(c.agents).length) a.push('--agents', JSON.stringify(c.agents));
  a.push(...(session.resume ? ['--resume', session.id] : ['--session-id', session.id]));
  a.push(...(c.cli.extraArgs ?? []));
  return a;
}
