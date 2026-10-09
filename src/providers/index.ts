import type { ProviderId } from '../core/types.ts';
import { claudeProvider } from './claude/index.ts';
import { codexProvider } from './codex/index.ts';
import type { Provider } from './types.ts';

export const providers: Record<ProviderId, Provider> = { claude: claudeProvider, codex: codexProvider };

export function getProvider(id: string): Provider {
  const p = providers[id as ProviderId];
  if (!p) throw new Error(`unknown provider "${id}" (expected claude or codex)`);
  return p;
}

export type { Provider } from './types.ts';
