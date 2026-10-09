#!/usr/bin/env node
// Hook bridge used by both Claude settings hooks and Codex [hooks].
// Usage (set up by the floor): um-hook.mjs <HookEventName>   (payload JSON on stdin)
// Forwards to the floor; prints any JSON decision for the CLI. Fails open:
// if the floor is unreachable the tool call proceeds ("no limits").
const event = process.argv[2] ?? '';
const { UM_URL, UM_TOKEN, UM_AGENT_ID } = process.env;

let input = '';
process.stdin.on('data', (d) => (input += d));
process.stdin.on('end', async () => {
  let payload = {};
  try {
    payload = JSON.parse(input || '{}');
  } catch {}
  if (!UM_URL) process.exit(0);
  try {
    const r = await fetch(`${UM_URL}/api/hook`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-um-token': UM_TOKEN ?? '' },
      body: JSON.stringify({ agentId: UM_AGENT_ID, event, payload }),
      signal: AbortSignal.timeout(590_000),
    });
    const out = await r.json();
    if (out && Object.keys(out).length) process.stdout.write(JSON.stringify(out));
  } catch {}
  process.exit(0);
});
