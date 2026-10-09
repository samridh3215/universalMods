import type { AgentEvent, AgentInfo, ProviderId, SpawnSpec, ToolDecision } from '../core/types.ts';

/** Everything a provider's config adapter needs to produce a per-agent config. */
export interface ConfigInput {
  agent: AgentInfo;
  spec: SpawnSpec;
  agentDir: string;
  /** Instructions describing the hive protocol + the agent's role. */
  instructions: string;
  /** stdio command for the hive MCP server, e.g. ['node', '/…/bin/hive-mcp.mjs'] */
  mcp: { command: string; args: string[]; env: Record<string, string> };
  /** Command run by provider hooks; it forwards the payload to the floor. */
  hookCommand: string;
  /** Absolute paths of skill folders (each containing SKILL.md) to expose. */
  skills: string[];
}

export interface StartContext {
  agent: AgentInfo;
  agentDir: string;
  config: Record<string, any>;
  env: Record<string, string>;
  /** Resume a previous session/thread instead of starting fresh. */
  resume?: string;
  emit(ev: AgentEvent): void;
  /** Ask the floor (and its mods) whether a tool call may run. */
  approve(tool: string, input: unknown): Promise<ToolDecision>;
  onExit(code: number | null): void;
  log(...a: unknown[]): void;
}

export interface ProviderSession {
  /** Start a new turn with this user text. Caller guarantees the agent is idle. */
  send(text: string): Promise<void>;
  /** Inject guidance into the running turn (or start one if idle). */
  steer(text: string): Promise<void>;
  interrupt(): Promise<void>;
  kill(): Promise<void>;
}

export interface Provider {
  id: ProviderId;
  /** Check the CLI is installed; returns version or an error the UI can show. */
  check(): Promise<{ ok: boolean; version?: string; error?: string; bin: string }>;
  /** Config adapter: provider-specific config with "no limits" defaults. Mods may patch it via config.build. */
  buildConfig(input: ConfigInput): Record<string, any>;
  /** Materialise the config on disk (for the CLI and for inspection). Returns files written. */
  writeConfig(input: ConfigInput, config: Record<string, any>): string[];
  start(ctx: StartContext): Promise<ProviderSession>;
}
