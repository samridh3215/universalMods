// Settings-file hooks (Claude settings.json / Codex [hooks]) → floor bus.
// Both CLIs speak the same hook I/O: JSON on stdin, optional JSON on stdout with
// hookSpecificOutput.permissionDecision for PreToolUse.
import type { Floor } from './floor.ts';

export async function handleHook(floor: Floor, b: { agentId: string; event: string; payload: Record<string, any> }) {
  const agent = floor.get(b.agentId);
  if (!agent) return {};
  const hookEventName = b.event || b.payload?.hook_event_name;
  const out = await floor.bus.emit('classic.hook', { agentId: agent.id, hookEventName, payload: b.payload ?? {} }, async (e) => {
    if (e.hookEventName === 'PreToolUse') {
      const d = await floor.approve(agent.id, e.payload.tool_name ?? 'tool', e.payload.tool_input, 'hook');
      if (d.decision === 'deny') {
        floor.o.broadcast({ type: 'toast', mod: 'floor', level: 'warn', text: `${agent.name}: blocked ${e.payload.tool_name} — ${d.reason}` });
        return { hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: d.reason } };
      }
    }
    return null;
  });
  return out ?? {};
}
