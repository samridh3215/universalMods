#!/usr/bin/env node
// Minimal stdio MCP server exposing the hive tools to an agent (Claude or Codex).
// It is a thin forwarder: tool calls go to the floor's HTTP API.
// Env: UM_URL, UM_TOKEN, UM_AGENT_ID (set per agent by the floor).
import readline from 'node:readline';

const { UM_URL, UM_TOKEN, UM_AGENT_ID } = process.env;
let tools = null;

async function api(path, body) {
  const r = await fetch(`${UM_URL}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { 'content-type': 'application/json', 'x-um-token': UM_TOKEN ?? '' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error ?? `HTTP ${r.status}`);
  return j;
}

const write = (o) => process.stdout.write(JSON.stringify({ jsonrpc: '2.0', ...o }) + '\n');

async function handle(msg) {
  const { id, method, params } = msg;
  switch (method) {
    case 'initialize':
      return { protocolVersion: params?.protocolVersion ?? '2025-06-18', capabilities: { tools: {} }, serverInfo: { name: 'hive', version: '0.1.0' } };
    case 'ping':
      return {};
    case 'tools/list':
      tools ??= (await api('/api/hive-tools')).tools;
      return { tools };
    case 'tools/call':
      try {
        const r = await api(`/api/mcp/${encodeURIComponent(params.name)}`, { agentId: UM_AGENT_ID, args: params.arguments ?? {} });
        return { content: [{ type: 'text', text: r.text }] };
      } catch (e) {
        return { content: [{ type: 'text', text: String(e.message ?? e) }], isError: true };
      }
    default:
      if (id === undefined) return undefined; // notification
      throw Object.assign(new Error(`method not found: ${method}`), { code: -32601 });
  }
}

readline.createInterface({ input: process.stdin }).on('line', async (line) => {
  if (!line.trim()) return;
  let msg;
  try {
    msg = JSON.parse(line);
  } catch {
    return;
  }
  try {
    const result = await handle(msg);
    if (msg.id !== undefined) write({ id: msg.id, result });
  } catch (e) {
    if (msg.id !== undefined) write({ id: msg.id, error: { code: e.code ?? -32603, message: String(e.message ?? e) } });
  }
});
