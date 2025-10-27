/**
 * In-memory storage adapter (useful for testing)
 * State is lost when the process ends or page refreshes
 *
 * @example
 * ```ts
 * import { createMemoryStorage, createPersister } from "@useflow/core";
 *
 * const storage = createMemoryStorage();
 * const persister = createPersister({ storage });
 * ```
 */

import type { PersistedFlowState } from "./state";
import type { FlowStorage } from "./storage";

/**
 * Creates a FlowStorage adapter using in-memory Map storage
 * Useful for testing or temporary state that doesn't need persistence
 *
 * @example
 * ```tsx
 * // Create memory storage
 * const storage = createMemoryStorage();
 *
 * // Use with persister
 * import { createPersister } from '@useflow/core';
 * const persister = createPersister({ storage });
 * ```
 */
export function createMemoryStorage(): FlowStorage {
  const store = new Map<string, PersistedFlowState>();

  // Internal key generation
  const makeKey = (flowId: string, instanceId?: string) =>
    instanceId ? `${flowId}:${instanceId}` : flowId;

  return {
    get(flowId: string, instanceId?: string): PersistedFlowState | null {
      return store.get(makeKey(flowId, instanceId)) ?? null;
    },

    set(flowId: string, state: PersistedFlowState, instanceId?: string): void {
      store.set(makeKey(flowId, instanceId), state);
    },

    remove(flowId: string, instanceId?: string): void {
      store.delete(makeKey(flowId, instanceId));
    },

    removeFlow(flowId: string): void {
      const baseKey = flowId;
      const pattern = `${baseKey}:`;

      Array.from(store.keys()).forEach((key) => {
        if (key === baseKey || key.startsWith(pattern)) {
          store.delete(key);
        }
      });
    },

    removeAll(): void {
      store.clear();
    },
  };
}
