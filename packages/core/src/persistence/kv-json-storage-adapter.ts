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
 * // Browser localStorage
 * const storage = kvJsonStorageAdapter({
 *   store: localStorage,
 *   formatKey: (flowId, instanceId) =>
 *     instanceId ? `useflow:${flowId}:${instanceId}` : `useflow:${flowId}`,
 *   listKeys: () => Object.keys(localStorage)
 * });
 *
 * // Custom key format
 * const storage = kvJsonStorageAdapter({
 *   store: localStorage,
 *   formatKey: (flowId, instanceId) =>
 *     instanceId ? `myapp:${flowId}:${instanceId}` : `myapp:${flowId}`,
 *   listKeys: () => Object.keys(localStorage)
 * });
 *
 * // React Native AsyncStorage
 * import AsyncStorage from '@react-native-async-storage/async-storage';
 * const storage = kvJsonStorageAdapter({
 *   store: AsyncStorage,
 *   formatKey: (flowId, instanceId) =>
 *     instanceId ? `myapp:${flowId}:${instanceId}` : `myapp:${flowId}`,
 *   listKeys: async () => await AsyncStorage.getAllKeys()
 * });
 *
 * const persister = createPersister({ storage });
 * ```
 */

import type { PersistedFlowState } from "../types";
import { deserializeFlowState, serializeFlowState } from "./state";
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
   * Key formatting function (required).
   * Constructs storage keys from flowId and optional instanceId.
   * You have full control over the key format.
   *
   * @example
   * ```ts
   * // Simple format
   * formatKey: (flowId, instanceId) => {
   *   return instanceId ? `useflow:${flowId}:${instanceId}` : `useflow:${flowId}`;
   * }
   *
   * // User-scoped keys
   * formatKey: (flowId, instanceId) => {
   *   const userId = getCurrentUserId();
   *   const base = `myapp:${userId}:${flowId}`;
   *   return instanceId ? `${base}:${instanceId}` : base;
   * }
   * // Results in: "myapp:alice:feedback:task-123"
   * ```
   */
  formatKey: (flowId: string, instanceId?: string) => string;

  /**
   * Optional function to enumerate storage keys.
   * Required for removeAll() and list() to work.
   *
   * @param flowId - Optional flow ID to filter keys (for removeFlow and list operations)
   * @returns Array of storage keys, or Promise<string[]>
   *
   * @example
   * ```ts
   * // Browser localStorage - enumerate all keys
   * listKeys: () => Object.keys(localStorage)
   *
   * // With flow filtering
   * listKeys: (flowId) => {
   *   const allKeys = Object.keys(localStorage);
   *   if (!flowId) return allKeys;
   *
   *   const baseKey = `useflow:${flowId}`;
   *   return allKeys.filter(key =>
   *     key === baseKey || key.startsWith(`${baseKey}:`)
   *   );
   * }
   *
   * // React Native AsyncStorage
   * listKeys: async () => await AsyncStorage.getAllKeys()
   *
   * // Redis with pattern matching
   * listKeys: async (flowId) => {
   *   if (flowId) return await redis.keys(`useflow:${flowId}*`);
   *   return await redis.keys('useflow:*');
   * }
   * ```
   */
  listKeys?: (flowId?: string) => string[] | Promise<string[]>;
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
 * // Browser localStorage
 * const storage = kvJsonStorageAdapter({
 *   store: localStorage,
 *   formatKey: (flowId, instanceId) =>
 *     instanceId ? `useflow:${flowId}:${instanceId}` : `useflow:${flowId}`,
 *   listKeys: () => Object.keys(localStorage)
 * });
 *
 * // sessionStorage
 * const storage = kvJsonStorageAdapter({
 *   store: sessionStorage,
 *   formatKey: (flowId, instanceId) =>
 *     instanceId ? `useflow:${flowId}:${instanceId}` : `useflow:${flowId}`,
 *   listKeys: () => Object.keys(sessionStorage)
 * });
 *
 * // React Native AsyncStorage
 * import AsyncStorage from '@react-native-async-storage/async-storage';
 * const storage = kvJsonStorageAdapter({
 *   store: AsyncStorage,
 *   formatKey: (flowId, instanceId) =>
 *     instanceId ? `myapp:${flowId}:${instanceId}` : `myapp:${flowId}`,
 *   listKeys: async () => await AsyncStorage.getAllKeys()
 * });
 *
 * // Custom key generation (e.g., user-specific)
 * const storage = kvJsonStorageAdapter({
 *   store: localStorage,
 *   formatKey: (flowId, instanceId) => {
 *     const base = `user:${currentUserId}:${flowId}`;
 *     return instanceId ? `${base}:${instanceId}` : base;
 *   },
 *   listKeys: () => Object.keys(localStorage)
 * });
 *
 * // Use with persister
 * const persister = createPersister({ storage, ttl: 7 * 24 * 60 * 60 * 1000 });
 * ```
 */
export function kvJsonStorageAdapter(options: KVJSONStorageAdapterOptions) {
  const { store, listKeys, formatKey } = options;

  return {
    async get(
      flowId: string,
      instanceId?: string,
    ): Promise<PersistedFlowState | null> {
      try {
        const key = formatKey(flowId, instanceId);
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
      const key = formatKey(flowId, instanceId);
      await store.setItem(key, serializeFlowState(state));
    },

    async remove(flowId: string, instanceId?: string): Promise<void> {
      const key = formatKey(flowId, instanceId);
      await store.removeItem(key);
    },

    async removeFlow(flowId: string): Promise<void> {
      if (!listKeys) return; // No-op if listKeys() not provided

      // Get all keys for this flow
      const keys = await listKeys(flowId);

      for (const key of keys) {
        await store.removeItem(key);
      }
    },

    async removeAll(): Promise<void> {
      if (!listKeys) return; // No-op if listKeys() not provided

      const keys = await listKeys();

      for (const key of keys) {
        await store.removeItem(key);
      }
    },

    async list(
      flowId: string,
    ): Promise<
      { instanceId: string | undefined; state: PersistedFlowState }[]
    > {
      if (!listKeys) return []; // Return empty array if listKeys() not provided

      const instances: {
        instanceId: string | undefined;
        state: PersistedFlowState;
      }[] = [];

      // Get all keys for this flow (base + instances)
      const keys = await listKeys(flowId);

      // Load each key and get instanceId from the state itself
      for (const key of keys) {
        try {
          const json = await store.getItem(key);
          if (!json) continue;

          const state = deserializeFlowState(json);
          if (!state) continue;

          instances.push({ instanceId: state.__meta?.instanceId, state });
        } catch {}
      }

      return instances;
    },

    formatKey,
  } satisfies KVFlowStorage;
}
