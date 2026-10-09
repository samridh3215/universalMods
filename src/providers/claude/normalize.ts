// Claude stream-json → provider-neutral AgentEvents.
import type { AgentEvent } from '../../core/types.ts';

export interface ClaudeNormState {
  /** total_cost_usd in `result` is cumulative per process; track the last value to emit deltas. */
  lastCost: number;
  tools: Map<string, { name: string; input: unknown }>;
}

export const newClaudeState = (): ClaudeNormState => ({ lastCost: 0, tools: new Map() });

function resultText(content: unknown): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) return content.map((c: any) => (typeof c === 'string' ? c : c?.text ?? '')).join('');
  return content == null ? '' : JSON.stringify(content);
}

export function normalizeClaude(o: any, st: ClaudeNormState): AgentEvent[] {
  const out: AgentEvent[] = [];
  switch (o?.type) {
    case 'system':
      if (o.subtype === 'init' && o.session_id) out.push({ kind: 'session', sessionId: o.session_id });
      if (o.subtype === 'compact_boundary') out.push({ kind: 'notice', text: 'context compacted' });
      break;
    case 'assistant':
      for (const c of o.message?.content ?? []) {
        if (c.type === 'text' && c.text) out.push({ kind: 'text', text: c.text, itemId: o.message?.id });
        else if (c.type === 'thinking' && c.thinking) out.push({ kind: 'reasoning', text: c.thinking });
        else if (c.type === 'tool_use') {
          st.tools.set(c.id, { name: c.name, input: c.input });
          out.push({ kind: 'tool', itemId: c.id, tool: c.name, input: c.input, status: 'started' });
        }
      }
      break;
    case 'user':
      for (const c of o.message?.content ?? []) {
        if (c?.type !== 'tool_result') continue;
        const t = st.tools.get(c.tool_use_id);
        out.push({
          kind: 'tool',
          itemId: c.tool_use_id,
          tool: t?.name ?? 'tool',
          input: t?.input,
          status: c.is_error ? 'failed' : 'completed',
          output: resultText(c.content).slice(0, 20000),
        });
        // Edits/writes also surface as file changes so views can show a diff list.
        if (t && /^(Edit|Write|MultiEdit|NotebookEdit)$/.test(t.name) && !c.is_error) {
          const inp: any = t.input ?? {};
          out.push({
            kind: 'file',
            itemId: c.tool_use_id,
            changes: [{ path: inp.file_path ?? inp.notebook_path ?? '?', kind: t.name === 'Write' ? 'add' : 'update', diff: inp.old_string != null ? `- ${inp.old_string}\n+ ${inp.new_string}` : undefined }],
          });
        }
        st.tools.delete(c.tool_use_id);
      }
      break;
    case 'result': {
      const u = o.usage ?? {};
      const cost = typeof o.total_cost_usd === 'number' ? o.total_cost_usd : st.lastCost;
      const delta = Math.max(0, cost - st.lastCost);
      st.lastCost = cost;
      out.push({
        kind: 'usage',
        usage: {
          input: (u.input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0),
          output: u.output_tokens ?? 0,
          cached: u.cache_read_input_tokens ?? 0,
          costUsd: delta,
        },
      });
      if (o.subtype === 'success' && !o.is_error) out.push({ kind: 'turn', phase: 'complete' });
      else out.push({ kind: 'turn', phase: o.subtype === 'error_during_execution' && /interrupt/i.test(String(o.result ?? '')) ? 'abort' : 'fail', error: String(o.result ?? o.subtype) });
      break;
    }
  }
  return out;
}
