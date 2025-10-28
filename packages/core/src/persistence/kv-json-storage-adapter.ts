/**
 * Key-Value JSON storage adapter
 *
 * Adapts any Storage-like interface (localStorage, sessionStorage, AsyncStorage, etc.)
 * to FlowStorage with automatic JSON serialization and key generation from flowId.
 *
 * Works with any storage that implements (sync or async):
 * - getItem(key: string): string | null | Promise<string | null>
 * - setItem(key: string, value: string): void | Promise<void>
 * - removeItem(key: string): void | Promise<void>
 *
 * Compatible with:
 * - Browser: localStorage, sessionStorage
 * - React Native: AsyncStorage
 * - Node.js: localStorage polyfills
 * - Any key-value store with the Storage interface
 *
 * @example
 * ```ts
 * import { kvJsonStorageAdapter, createPersister } from "@useflow/core";
 *
 * // Browser localStorage (uses default key: "useflow:${flowId}")
 * const storage = kvJsonStorageAdapter({ store: localStorage });
 *
 * // Custom prefix
 * const storage = kvJsonStorageAdapter({
 *   store: localStorage,
 *   getKey: (flowId) => `myapp:${flowId}`
 * });
 *
 * // React Native AsyncStorage
 * import AsyncStorage from '@react-native-async-storage/async-storage';
 * const storage = kvJsonStorageAdapter({
 *   store: AsyncStorage,
 *   getKey: (flowId) => `myapp:${flowId}`
 * });
 *
 * const persister = createPersister({ storage });
 * ```
 */

import { deserializeFlowState, type PersistedFlowState } from "./state";
import type { KVFlowStorage } from "./storage";

/**
 * Options for KV JSON storage adapter
 */
export type KVJSONStorageAdapterOptions = {
  /**
   * Key-value storage backend (required)
   * Any object with getItem/setItem/removeItem methods
   *
   * Examples:
   * - Browser: localStorage, sessionStorage
   * - React Native: AsyncStorage
   * - Node.js: localStorage polyfills
   */
  store: Storage;

  /**
   * Prefix for all keys created by this storage adapter.
   * Used for bulk operations like removeAll().
   *
   * @default "useflow"
   */
  prefix?: string;

  /**
   * Custom key format function.
   * The prefix will be automatically prepended to ensure bulk operations work correctly.
   *
   * @default (flowId, instanceId) => {
   *   const base = flowId;
   *   return instanceId ? `${base}:${instanceId}` : base;
   * }
   *
   * @example
   * ```ts
   * // User-scoped keys
   * getKey: (flowId, instanceId) => {
   *   const userId = getCurrentUserId();
   *   const base = `${userId}:${flowId}`;
   *   return instanceId ? `${base}:${instanceId}` : base;
   * }
   * // Results in: "useflow:alice:feedback:task-123"
   * //             ^^^^^^^ prefix added automatically
   * ```
   */
  getKey?: (flowId: string, instanceId?: string) => string;
};

/**
 * Creates a FlowStorage adapter with JSON serialization for key-value stores
 *
 * This adapter:
 * - Converts flowId to storage keys (configurable via getKey)
 * - Handles JSON serialization/deserialization automatically
 * - Works with any Storage-like interface (localStorage, AsyncStorage, etc.)
 * - Validates structure on deserialization
 * - Gracefully handles errors
 *
 * @example
 * ```tsx
 * // Browser localStorage (default key: "useflow:${flowId}")
 * const storage = kvJsonStorageAdapter({ store: localStorage });
 *
 * // Custom prefix
 * const storage = kvJsonStorageAdapter({
 *   store: localStorage,
 *   getKey: (flowId) => `myapp:${flowId}`
 * });
 *
 * // sessionStorage
 * const storage = kvJsonStorageAdapter({ store: sessionStorage });
 *
 * // React Native AsyncStorage
 * import AsyncStorage from '@react-native-async-storage/async-storage';
 * const storage = kvJsonStorageAdapter({ store: AsyncStorage });
 *
 * // Custom key generation (e.g., user-specific)
 * const storage = kvJsonStorageAdapter({
 *   store: localStorage,
 *   getKey: (flowId) => `user:${currentUserId}:${flowId}`
 * });
 *
 * // Use with persister
 * const persister = createPersister({ storage, ttl: 7 * 24 * 60 * 60 * 1000 });
 * ```
 */
export function kvJsonStorageAdapter(options: KVJSONStorageAdapterOptions) {
  const { store, prefix = "useflow" } = options;

  // Build key function - ALWAYS adds prefix
  const getKey = (flowId: string, instanceId?: string): string => {
    if (options.getKey) {
      const userKey = options.getKey(flowId, instanceId);
      return `${prefix}:${userKey}`;
    }
    const base = flowId;
    return instanceId ? `${prefix}:${base}:${instanceId}` : `${prefix}:${base}`;
  };

  return {
    async get(
      flowId: string,
      instanceId?: string,
    ): Promise<PersistedFlowState | null> {
      try {
        const key = getKey(flowId, instanceId);
        const json = await store.getItem(key);
        return json ? deserializeFlowState(json) : null;
      } catch {
        return null;
      }
    },

    async set(
      flowId: string,
      state: PersistedFlowState,
      instanceId?: string,
    ): Promise<void> {
      const key = getKey(flowId, instanceId);
      await store.setItem(key, JSON.stringify(state));
    },

    async remove(flowId: string, instanceId?: string): Promise<void> {
      const key = getKey(flowId, instanceId);
      await store.removeItem(key);
    },

    async removeFlow(flowId: string): Promise<void> {
      const baseKey = getKey(flowId);
      const pattern = `${baseKey}:`;

      Object.keys(store).forEach((key) => {
        if (key === baseKey || key.startsWith(pattern)) {
          store.removeItem(key);
        }
      });
    },

    async removeAll(): Promise<void> {
      const prefixPattern = `${prefix}:`;

      Object.keys(store).forEach((key) => {
        if (key.startsWith(prefixPattern)) {
          store.removeItem(key);
        }
      });
    },

    async list(
      flowId: string,
    ): Promise<
      Array<{ instanceId: string | undefined; state: PersistedFlowState }>
    > {
      const baseKey = getKey(flowId);
      const pattern = `${baseKey}:`;
      const instances: Array<{
        instanceId: string | undefined;
        state: PersistedFlowState;
      }> = [];

      // Iterate through all keys in storage
      for (let i = 0; i < store.length; i++) {
        const key = store.key?.(i);
        if (!key) continue;

        // Check if this key is the base flow or an instance
        if (key === baseKey || key.startsWith(pattern)) {
          try {
            const json = await store.getItem(key);
            if (!json) continue;

            const state = deserializeFlowState(json);
            if (!state) continue;

            // Extract instance ID from key (everything after the pattern)
            // For base key, use undefined as instanceId
            const instanceId =
              key === baseKey ? undefined : key.substring(pattern.length);
            instances.push({ instanceId, state });
          } catch {
            // Skip invalid entries
            // biome-ignore lint/complexity/noUselessContinue: defensive programming in case more is added after this block
            continue;
          }
        }
      }

      return instances;
    },

    getKey,
  } satisfies KVFlowStorage;
}
