// Codex app-server notifications → provider-neutral AgentEvents.
import type { AgentEvent } from '../../core/types.ts';

export interface CodexNormState {
  lastTotal: { input: number; output: number; cached: number };
}

export const newCodexState = (): CodexNormState => ({ lastTotal: { input: 0, output: 0, cached: 0 } });

function toolOf(item: any): { tool: string; input: unknown } | undefined {
  switch (item?.type) {
    case 'commandExecution':
      return { tool: 'shell', input: { command: item.command, cwd: item.cwd } };
    case 'mcpToolCall':
      return { tool: `${item.server}.${item.tool}`, input: item.arguments };
    case 'dynamicToolCall':
      return { tool: item.tool, input: item.arguments };
    case 'webSearch':
      return { tool: 'web_search', input: { query: item.query } };
    case 'collabAgentToolCall':
      return { tool: `agent.${item.tool}`, input: { prompt: item.prompt, receivers: item.receiverThreadIds } };
  }
  return undefined;
}

function toolOutput(item: any): string | undefined {
  if (item.type === 'commandExecution') return item.aggregatedOutput ?? undefined;
  if (item.type === 'mcpToolCall') return item.error ? JSON.stringify(item.error) : JSON.stringify(item.result?.content ?? item.result ?? null);
  if (item.type === 'dynamicToolCall') return JSON.stringify(item.contentItems ?? null);
  return undefined;
}

export function normalizeCodex(method: string, p: any, st: CodexNormState): AgentEvent[] {
  switch (method) {
    case 'thread/started':
      return p?.thread?.id ? [{ kind: 'session', sessionId: p.thread.id }] : [];
    case 'turn/started':
      return [{ kind: 'turn', phase: 'start', turnId: p.turn?.id }];
    case 'turn/completed': {
      const s = p.turn?.status;
      const phase = s === 'completed' ? 'complete' : s === 'interrupted' ? 'abort' : 'fail';
      return [{ kind: 'turn', phase, turnId: p.turn?.id, error: p.turn?.error?.message }];
    }
    case 'item/agentMessage/delta':
      return [{ kind: 'text', text: p.delta, itemId: p.itemId, delta: true }];
    case 'item/started': {
      const t = toolOf(p.item);
      return t ? [{ kind: 'tool', itemId: p.item.id, ...t, status: 'started' }] : [];
    }
    case 'item/completed': {
      const item = p.item;
      if (item.type === 'agentMessage') return [{ kind: 'text', text: item.text, itemId: item.id }];
      if (item.type === 'reasoning') {
        const text = [...(item.summary ?? []), ...(item.content ?? [])].join('\n').trim();
        return text ? [{ kind: 'reasoning', text, itemId: item.id }] : [];
      }
      if (item.type === 'fileChange')
        return [{ kind: 'file', itemId: item.id, changes: (item.changes ?? []).map((c: any) => ({ path: c.path, kind: typeof c.kind === 'string' ? c.kind : c.kind?.type ?? 'update', diff: c.diff })) }];
      if (item.type === 'contextCompaction') return [{ kind: 'notice', text: 'context compacted' }];
      const t = toolOf(item);
      if (!t) return [];
      const failed = item.status === 'failed' || item.status === 'declined' || (item.exitCode != null && item.exitCode !== 0) || item.success === false;
      return [{ kind: 'tool', itemId: item.id, ...t, status: failed ? 'failed' : 'completed', output: toolOutput(item)?.slice(0, 20000), exitCode: item.exitCode ?? null }];
    }
    case 'thread/tokenUsage/updated': {
      const t = p.tokenUsage?.total;
      if (!t) return [];
      const cur = { input: t.inputTokens ?? 0, output: (t.outputTokens ?? 0) + (t.reasoningOutputTokens ?? 0), cached: t.cachedInputTokens ?? 0 };
      const d = { input: cur.input - st.lastTotal.input, output: cur.output - st.lastTotal.output, cached: cur.cached - st.lastTotal.cached };
      st.lastTotal = cur;
      // Codex reports tokens, not dollars; cost stays 0 unless a mod prices it.
      return [{ kind: 'usage', usage: { ...d, costUsd: 0 } }];
    }
    case 'mcpServer/startupStatus/updated':
      return p?.status === 'failed' ? [{ kind: 'error', message: `MCP server ${p.name} failed: ${p.error ?? ''}` }] : [];
    case 'error':
      return [{ kind: 'error', message: `${p.error?.message ?? 'error'}${p.willRetry ? ' (retrying)' : ''}` }];
  }
  return [];
}
