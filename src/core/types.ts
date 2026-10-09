// Shared types for the universalMods core, providers, server and server-side mods.
// Server mods import these as `import type { Register } from 'universal-mods/server'`.

export type ProviderId = 'claude' | 'codex';

export type AgentStatus = 'starting' | 'idle' | 'working' | 'blocked' | 'held' | 'stopped' | 'error';

export interface Usage {
  input: number;
  output: number;
  cached: number;
  costUsd: number;
}

export interface AgentInfo {
  id: string;
  name: string;
  role: string;
  provider: ProviderId;
  model?: string;
  cwd: string;
  status: AgentStatus;
  sessionId?: string;
  createdAt: number;
  usage: Usage;
  turns: number;
  held: boolean;
  skills: string[];
  lastActivity?: string;
  archived?: boolean;
}

export interface SpawnSpec {
  name?: string;
  role?: string;
  model?: string;
  effort?: string;
  cwd?: string;
  worktree?: boolean;
  skills?: string[];
  prompt?: string;
  /** Provider-specific extra config merged into the generated config. */
  extra?: Record<string, unknown>;
}

/** Provider-neutral stream event. Views only ever see these. */
export type AgentEvent =
  | { kind: 'user'; text: string; from?: string }
  | { kind: 'text'; text: string; itemId?: string; delta?: boolean }
  | { kind: 'reasoning'; text: string; itemId?: string }
  | {
      kind: 'tool';
      itemId: string;
      tool: string;
      input: unknown;
      status: 'started' | 'completed' | 'failed';
      output?: string;
      exitCode?: number | null;
    }
  | { kind: 'file'; itemId?: string; changes: { path: string; kind: string; diff?: string }[] }
  | { kind: 'usage'; usage: Partial<Usage>; cumulative?: boolean }
  | { kind: 'turn'; phase: 'start' | 'complete' | 'abort' | 'fail'; turnId?: string; error?: string }
  | { kind: 'session'; sessionId: string }
  | { kind: 'error'; message: string }
  | { kind: 'notice'; text: string };

export interface StampedEvent {
  seq: number;
  ts: number;
  agentId: string;
  event: AgentEvent;
}

export interface Task {
  id: string;
  title: string;
  detail?: string;
  status: 'todo' | 'doing' | 'review' | 'done';
  assignee?: string;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface HiveMessage {
  id: string;
  from: string;
  to: string;
  text: string;
  ts: number;
}

export type ToolDecision = { decision: 'allow' | 'deny'; reason?: string };

/** Event name → [input, output]. Hooks receive input and resolve to output. */
export interface EventMap {
  'session.start': [{ provider: ProviderId; dataDir: string }, void];
  'agent.spawn': [{ spec: SpawnSpec; by: string }, AgentInfo];
  'agent.status': [{ agent: AgentInfo; status: AgentStatus; prev: AgentStatus }, void];
  'agent.event': [{ agent: AgentInfo; event: AgentEvent }, void];
  'agent.exit': [{ agent: AgentInfo; code: number | null }, void];
  'prompt.submit': [{ agentId: string; text: string; from: string }, { text: string } | null];
  'message.send': [HiveMessage, { delivered: boolean }];
  'tool.call': [
    { agentId: string; tool: string; input: unknown; source: 'hook' | 'approval'; provider: ProviderId },
    ToolDecision,
  ];
  'config.build': [{ provider: ProviderId; agent: AgentInfo; spec: SpawnSpec; config: Record<string, any> }, Record<string, any>];
  'task.add': [Omit<Task, 'id' | 'createdAt' | 'updatedAt'>, Task];
  'task.update': [{ id: string; patch: Partial<Task>; by: string }, Task | null];
  'board.update': [{ text: string; by: string }, { text: string }];
  'ui.press': [{ mod: string; key: string; payload?: unknown }, unknown];
  'command.run': [{ name: string; args: string; by: string }, { text: string } | null];
  'classic.hook': [{ agentId: string; hookEventName: string; payload: Record<string, any> }, Record<string, any> | null];
}

export type EventName = keyof EventMap;
export type EventIn<K extends EventName> = EventMap[K][0];
export type EventOut<K extends EventName> = EventMap[K][1];

export type Next<K extends EventName> = ((e?: EventIn<K>) => Promise<EventOut<K>>) & { called: boolean };

export type Hook<K extends EventName> = ($: ModContext, e: Readonly<EventIn<K>>, next: Next<K>) => EventOut<K> | Promise<EventOut<K>>;

export type CatchHook<K extends EventName> = (
  $: ModContext,
  e: Readonly<EventIn<K>>,
  next: Next<K>,
  err: unknown,
) => EventOut<K> | Promise<EventOut<K>>;

/** Shallow matcher: each key must equal (or RegExp-test) the same key on the event. */
export type Matcher = Record<string, string | number | boolean | RegExp> | ((e: any) => boolean);

export interface HookHandle<K extends EventName> {
  catch(fn: CatchHook<K>): HookHandle<K>;
}

type UnionToIntersection<U> = (U extends any ? (x: U) => void : never) extends (x: infer I) => void ? I : never;

/** `on(event, matcher?, hook)` — one overload per event so hook return types check precisely. */
export type On = UnionToIntersection<
  {
    [K in EventName]: {
      (event: K, hook: Hook<K>): HookHandle<K>;
      (event: K, matcher: Matcher, hook: Hook<K>): HookHandle<K>;
    };
  }[EventName]
>;

export interface ModContext {
  mod: string;
  provider: ProviderId;
  dataDir: string;
  agent: {
    list(): AgentInfo[];
    get(id: string): AgentInfo | undefined;
    spawn(spec: SpawnSpec): Promise<AgentInfo>;
    send(id: string, text: string, from?: string): Promise<void>;
    steer(id: string, text: string): Promise<void>;
    interrupt(id: string): Promise<void>;
    kill(id: string): Promise<void>;
    hold(id: string, held: boolean): void;
    events(id: string, limit?: number): StampedEvent[];
  };
  hive: {
    tasks(): Task[];
    addTask(t: { title: string; detail?: string; assignee?: string }): Promise<Task>;
    updateTask(id: string, patch: Partial<Task>): Promise<Task | null>;
    board(): string;
    setBoard(text: string): Promise<void>;
    message(from: string, to: string, text: string): Promise<{ delivered: boolean }>;
  };
  ui: {
    toast(text: string, level?: 'info' | 'warn' | 'error'): void;
    status(text: string | undefined): void;
    /** Push arbitrary data to this mod's client views (received via useModChannel). */
    publish(channel: string, data: unknown): void;
  };
  state: {
    get<T>(key: string, init: T): T;
    set<T>(key: string, value: T): void;
  };
  store: {
    get<T>(key: string, init: T): T;
    set<T>(key: string, value: T): void;
  };
  clock: {
    every(ms: number, fn: () => void): void;
    after(ms: number, fn: () => void): void;
  };
  command: {
    register(name: string, description: string): void;
  };
  log(...args: unknown[]): void;
}

export type Register = (on: On, options: Record<string, unknown>) => void | Promise<void>;

export interface ModManifest {
  id: string;
  name: string;
  description?: string;
  enabled?: boolean;
  /** Only load on floors using this provider. Omit for both. */
  provider?: ProviderId;
  server?: string;
  client?: string;
  options?: Record<string, unknown>;
}
