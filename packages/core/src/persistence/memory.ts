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

import type { PersistedFlowState } from "../types";
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

    list(
      flowId: string,
    ): Array<{ instanceId: string | undefined; state: PersistedFlowState }> {
      const baseKey = flowId;
      const pattern = `${baseKey}:`;
      const instances: Array<{
        instanceId: string | undefined;
        state: PersistedFlowState;
      }> = [];

      Array.from(store.entries()).forEach(([key, state]) => {
        // Check if this key is the base flow or an instance
        if (key === baseKey || key.startsWith(pattern)) {
          // Extract instance ID from key (everything after the pattern)
          // For base key, use undefined as instanceId
          const instanceId =
            key === baseKey ? undefined : key.substring(pattern.length);
          instances.push({ instanceId, state });
        }
      });

      return instances;
    },
  };
}
