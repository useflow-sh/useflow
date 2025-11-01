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

import type { PersistedFlowInstance, PersistedFlowState } from "../../types";
import type { FlowStore, FlowStoreOptions } from "../store";

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
 * import { createPersister} from '@useflow/core';
 * const persister = createPersister({ store });
 * ```
 */
export function createMemoryStore() {
  const storage = new Map<string, PersistedFlowInstance>();

  // Internal key generation - always includes all 3 segments
  const makeKey = (flowId: string, options?: FlowStoreOptions) => {
    const vid = options?.variantId || "default";
    const iid = options?.instanceId || "default";
    return `${flowId}:${vid}:${iid}`;
  };

  return {
    get(flowId: string, options?: FlowStoreOptions): PersistedFlowState | null {
      const instance = storage.get(makeKey(flowId, options));
      // Unwrap: return just the state from the stored instance
      return instance ? instance.state : null;
    },

    set(
      flowId: string,
      state: PersistedFlowState,
      options?: FlowStoreOptions,
    ): void {
      // Wrap: store the complete instance with all identifiers
      const instance: PersistedFlowInstance = {
        flowId,
        instanceId: options?.instanceId || "default",
        variantId: options?.variantId || "default",
        state,
      };
      storage.set(makeKey(flowId, options), instance);
    },

    remove(flowId: string, options?: FlowStoreOptions): void {
      storage.delete(makeKey(flowId, options));
    },

    removeFlow(flowId: string): void {
      const baseKey = `${flowId}:`;

      Array.from(storage.keys()).forEach((key) => {
        if (key.startsWith(baseKey)) {
          storage.delete(key);
        }
      });
    },

    removeAll(): void {
      storage.clear();
    },

    list(flowId: string): PersistedFlowInstance[] {
      const baseKey = `${flowId}:`;
      const instances: PersistedFlowInstance[] = [];

      Array.from(storage.entries()).forEach(([key, instance]) => {
        if (key.startsWith(baseKey)) {
          // Instance is already stored with all identifiers - just return it
          instances.push(instance);
        }
      });

      return instances;
    },
  } satisfies FlowStore;
}
