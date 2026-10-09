import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { AgentEvent, AgentInfo } from '../src/core/types.ts';
import { buildClaudeConfig, claudeArgs, writeClaudeConfig } from '../src/providers/claude/config.ts';
import { newClaudeState, normalizeClaude } from '../src/providers/claude/normalize.ts';
import { buildCodexConfig, writeCodexConfig } from '../src/providers/codex/config.ts';
import { newCodexState, normalizeCodex } from '../src/providers/codex/normalize.ts';
import { toToml } from '../src/providers/util.ts';

const fixture = (f: string) =>
  fs
    .readFileSync(path.join(__dirname, 'fixtures', f), 'utf8')
    .trim()
    .split('\n')
    .map((l) => JSON.parse(l));

describe('Claude normalizer (recorded stream-json)', () => {
  const st = newClaudeState();
  const evs: AgentEvent[] = fixture('claude-stream.jsonl').flatMap((o) => normalizeClaude(o, st));

  it('emits session, tool start/complete, text, usage and turn completion', () => {
    expect(evs.find((e) => e.kind === 'session')).toBeTruthy();
    const tools = evs.filter((e) => e.kind === 'tool') as Extract<AgentEvent, { kind: 'tool' }>[];
    expect(tools.map((t) => [t.tool, t.status])).toEqual([
      ['Bash', 'started'],
      ['Bash', 'completed'],
    ]);
    expect(tools[1].output).toContain('hi');
    expect(evs.filter((e) => e.kind === 'text').map((e) => (e as any).text)).toEqual(['DONE', 'OK2']);
    expect(evs.filter((e) => e.kind === 'turn').map((e) => (e as any).phase)).toEqual(['complete', 'complete']);
  });

  it('turns cumulative total_cost_usd into per-turn deltas', () => {
    const costs = evs.filter((e) => e.kind === 'usage').map((e) => (e as any).usage.costUsd);
    expect(costs).toHaveLength(2);
    expect(costs[0]).toBeCloseTo(0.00893256, 6);
    expect(costs[1]).toBeCloseTo(0.00936637 - 0.00893256, 6);
  });
});

describe('Codex normalizer (app-server notifications)', () => {
  const st = newCodexState();
  const evs = fixture('codex-notifications.jsonl').flatMap((m) => normalizeCodex(m.method, m.params, st));

  it('maps items to tools, files, text and turns', () => {
    expect(evs[0]).toEqual({ kind: 'session', sessionId: 'thr_1' });
    expect(evs).toContainEqual(expect.objectContaining({ kind: 'tool', tool: 'shell', status: 'completed', output: 'total 0\n', exitCode: 0 }));
    expect(evs).toContainEqual(expect.objectContaining({ kind: 'tool', tool: 'hive.send_message', status: 'completed' }));
    expect(evs).toContainEqual({ kind: 'file', itemId: 'it_2', changes: [{ path: 'a.txt', kind: 'add', diff: '+hi' }] });
    expect(evs.filter((e) => e.kind === 'text').map((e) => (e as any).text)).toEqual(['Hel', 'lo', 'Hello']);
    expect(evs.at(-1)).toEqual({ kind: 'turn', phase: 'abort', turnId: 'turn_1', error: undefined });
  });

  it('turns cumulative token totals into deltas', () => {
    const u = evs.filter((e) => e.kind === 'usage').map((e) => (e as any).usage);
    expect(u[0]).toEqual({ input: 100, output: 50, cached: 40, costUsd: 0 });
    expect(u[1]).toEqual({ input: 80, output: 20, cached: 0, costUsd: 0 });
  });
});

describe('config adapters', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'um-cfg-'));
  const agent = { id: 'a1', name: 'A', cwd: path.join(dir, 'work') } as AgentInfo;
  fs.mkdirSync(agent.cwd);
  const skill = path.join(dir, 'skills', 'demo');
  fs.mkdirSync(skill, { recursive: true });
  fs.writeFileSync(path.join(skill, 'SKILL.md'), '---\nname: demo\ndescription: d\n---\n');
  const input = {
    agent,
    spec: { model: 'm1', effort: 'high' },
    agentDir: path.join(dir, 'agent'),
    instructions: 'be nice',
    mcp: { command: 'node', args: ['hive.mjs'], env: { UM_AGENT_ID: 'a1' } },
    hookCommand: 'node hook.mjs',
    skills: [skill],
  };

  it('Claude: no-limits flags, settings hooks, mcp json, skills as a session plugin', () => {
    const c = buildClaudeConfig(input);
    const files = writeClaudeConfig(input, c);
    const args = claudeArgs(input.agentDir, c, { id: 'sess', resume: false });
    expect(args).toContain('--dangerously-skip-permissions');
    expect(args).toEqual(expect.arrayContaining(['--model', 'm1', '--effort', 'high', '--session-id', 'sess']));
    expect(claudeArgs(input.agentDir, c, { id: 'sess', resume: true })).toEqual(expect.arrayContaining(['--resume', 'sess']));
    const settings = JSON.parse(fs.readFileSync(files[0], 'utf8'));
    expect(settings.hooks.PreToolUse[0].hooks[0].command).toBe('node hook.mjs PreToolUse');
    expect(JSON.parse(fs.readFileSync(files[1], 'utf8')).mcpServers.hive.command).toBe('node');
    expect(fs.existsSync(path.join(input.agentDir, 'claude/plugin/skills/demo/SKILL.md'))).toBe(true);
  });

  it('Codex: full-access thread params, -c overrides, skills in .agents/skills', () => {
    const c = buildCodexConfig(input);
    writeCodexConfig(input, c);
    expect(c.thread).toMatchObject({ approvalPolicy: 'never', sandbox: 'danger-full-access', model: 'm1', developerInstructions: 'be nice' });
    expect(c.overrides['features.hooks']).toBe(true);
    expect(toToml(c.overrides['mcp_servers.hive'])).toBe('{ command = "node", args = ["hive.mjs"], env = { UM_AGENT_ID = "a1" }, tool_timeout_sec = 3600 }');
    expect(fs.existsSync(path.join(agent.cwd, '.agents/skills/demo/SKILL.md'))).toBe(true);
    expect(fs.readFileSync(path.join(input.agentDir, 'codex/config.toml'), 'utf8')).toContain('mcp_servers.hive = {');
  });
});
