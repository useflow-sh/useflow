/**
 * In-memory store (useful for testing)
 * State is lost when the process ends or page refreshes
 *
 * @example
 * ```ts
 * import { createMemoryStore, createPersister } from "@useflow/core";
 *
 * const store = createMemoryStore();
 * const persister = createPersister({ store });
 * ```
 */

import type { PersistedFlowState } from "../../types";
import type { FlowStore } from "../store";

/**
 * Creates a FlowStore using in-memory Map
 * Useful for testing or temporary state that doesn't need persistence
 *
 * @example
 * ```tsx
 * // Create memory store
 * const store = createMemoryStore();
 *
 * // Use with persister
 * import { createPersister } from '@useflow/core';
 * const persister = createPersister({ store });
 * ```
 */
export function createMemoryStore() {
  const storage = new Map<string, PersistedFlowState>();

  // Internal key generation
  const makeKey = (flowId: string, instanceId?: string) =>
    instanceId ? `${flowId}:${instanceId}` : flowId;

  return {
    get(flowId: string, instanceId?: string): PersistedFlowState | null {
      return storage.get(makeKey(flowId, instanceId)) ?? null;
    },

    set(flowId: string, state: PersistedFlowState, instanceId?: string): void {
      storage.set(makeKey(flowId, instanceId), state);
    },

    remove(flowId: string, instanceId?: string): void {
      storage.delete(makeKey(flowId, instanceId));
    },

    removeFlow(flowId: string): void {
      const baseKey = flowId;
      const pattern = `${baseKey}:`;

      Array.from(storage.keys()).forEach((key) => {
        if (key === baseKey || key.startsWith(pattern)) {
          storage.delete(key);
        }
      });
    },

    removeAll(): void {
      storage.clear();
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

      Array.from(storage.entries()).forEach(([key, state]) => {
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
  } satisfies FlowStore;
}
