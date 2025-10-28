/**
 * Key-Value storage adapter
 *
 * Adapts any Storage-like interface (localStorage, sessionStorage, AsyncStorage, etc.)
 * to FlowStore with customizable serialization and key generation from flowId.
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
 * - Any key-value storage with the Storage interface
 *
 * @example
 * ```ts
 * import { kvStorageAdapter, createPersister } from "@useflow/core";
 *
 * // Browser localStorage (uses default JSON serializer)
 * const store = kvStorageAdapter({
 *   storage: localStorage,
 *   formatKey: (flowId, instanceId) =>
 *     instanceId ? `useflow:${flowId}:${instanceId}` : `useflow:${flowId}`,
 *   listKeys: () => Object.keys(localStorage)
 * });
 *
 * // Custom key format
 * const store = kvStorageAdapter({
 *   storage: localStorage,
 *   formatKey: (flowId, instanceId) =>
 *     instanceId ? `myapp:${flowId}:${instanceId}` : `myapp:${flowId}`,
 *   listKeys: () => Object.keys(localStorage)
 * });
 *
 * // React Native AsyncStorage
 * import AsyncStorage from '@react-native-async-storage/async-storage';
 * const store = kvStorageAdapter({
 *   storage: AsyncStorage,
 *   formatKey: (flowId, instanceId) =>
 *     instanceId ? `myapp:${flowId}:${instanceId}` : `myapp:${flowId}`,
 *   listKeys: async () => await AsyncStorage.getAllKeys()
 * });
 *
 * const persister = createPersister({ store });
 * ```
 */

import type { PersistedFlowState } from "../types";
import type { Serializer } from "./serializer";
import type { KVFlowStore } from "./store";

/**
 * Generic key-value storage interface
 */
export interface KVStore<T> {
  getItem(key: string): T | null | Promise<T | null>;
  setItem(key: string, value: T): void | Promise<void>;
  removeItem(key: string): void | Promise<void>;
}

/**
 * Options for KV storage adapter
 */
export type KVStorageAdapterOptions<T = string> = {
  /**
   * Key-value storage backend (required)
   * Any object with getItem/setItem/removeItem methods
   *
   * Examples:
   * - Browser: localStorage, sessionStorage (string-based)
   * - React Native: AsyncStorage (string-based)
   * - Custom binary stores (Uint8Array-based)
   * - Node.js: localStorage polyfills
   */
  storage: KVStore<T>;

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
   * Required for removeAll(), removeFlow(), and list() to work.
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

  /**
   * Serializer (required)
   * Converts flow state to/from storage format
   *
   * Implement the Serializer<T> interface to provide custom serialization:
   * - Serializer<string> for text-based stores (JSON, YAML, compressed strings)
   * - Serializer<Uint8Array> for binary stores (MessagePack, Protocol Buffers)
   *
   * @example
   * ```ts
   * import { kvStorageAdapter, JsonSerializer } from '@useflow/react';
   *
   * // String-based serialization (default: JSON)
   * const store = kvStorageAdapter({
   *   storage: localStorage,
   *   formatKey: (flowId, instanceId) =>
   *     instanceId ? `app:${flowId}:${instanceId}` : `app:${flowId}`,
   *   serializer: JsonSerializer
   * });
   * ```
   */
  serializer: Serializer<T>;
};

/**
 * Creates a FlowStore adapter for key-value stores
 *
 * This adapter:
 * - Converts flowId to storage keys (configurable via formatKey)
 * - Handles serialization/deserialization with any Serializer<T>
 * - Works with any KV storage interface
 * - Validates structure on deserialization
 * - Gracefully handles errors
 *
 * @example
 * ```tsx
 * // Browser localStorage (JSON serialization)
 * const store = kvStorageAdapter({
 *   storage: localStorage,
 *   formatKey: (flowId, instanceId) =>
 *     instanceId ? `useflow:${flowId}:${instanceId}` : `useflow:${flowId}`,
 *   listKeys: () => Object.keys(localStorage),
 *   serializer: JsonSerializer
 * });
 *
 * // sessionStorage
 * const store = kvStorageAdapter({
 *   storage: sessionStorage,
 *   formatKey: (flowId, instanceId) =>
 *     instanceId ? `useflow:${flowId}:${instanceId}` : `useflow:${flowId}`,
 *   listKeys: () => Object.keys(sessionStorage),
 *   serializer: JsonSerializer
 * });
 *
 * // React Native AsyncStorage
 * import AsyncStorage from '@react-native-async-storage/async-storage';
 * const store = kvStorageAdapter({
 *   storage: AsyncStorage,
 *   formatKey: (flowId, instanceId) =>
 *     instanceId ? `myapp:${flowId}:${instanceId}` : `myapp:${flowId}`,
 *   listKeys: async () => await AsyncStorage.getAllKeys(),
 *   serializer: JsonSerializer
 * });
 *
 * // Custom key generation (e.g., user-specific)
 * const store = kvStorageAdapter({
 *   storage: localStorage,
 *   formatKey: (flowId, instanceId) => {
 *     const base = `user:${currentUserId}:${flowId}`;
 *     return instanceId ? `${base}:${instanceId}` : base;
 *   },
 *   listKeys: () => Object.keys(localStorage),
 *   serializer: JsonSerializer
 * });
 *
 * // Use with persister
 * const persister = createPersister({ store, ttl: 7 * 24 * 60 * 60 * 1000 });
 * ```
 */
export function kvStorageAdapter<T>(options: KVStorageAdapterOptions<T>) {
  const { storage, listKeys, formatKey, serializer } = options;

  return {
    async get(
      flowId: string,
      instanceId?: string,
    ): Promise<PersistedFlowState | null> {
      try {
        const key = formatKey(flowId, instanceId);
        const data = await storage.getItem(key);
        return data ? serializer.deserialize(data) : null;
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
      const serialized = serializer.serialize(state);
      await storage.setItem(key, serialized);
    },

    async remove(flowId: string, instanceId?: string): Promise<void> {
      const key = formatKey(flowId, instanceId);
      await storage.removeItem(key);
    },

    async removeFlow(flowId: string): Promise<void> {
      if (!listKeys) return; // No-op if listKeys() not provided

      // Get all keys for this flow
      const keys = await listKeys(flowId);

      for (const key of keys) {
        await storage.removeItem(key);
      }
    },

    async removeAll(): Promise<void> {
      if (!listKeys) return; // No-op if listKeys() not provided

      const keys = await listKeys();

      for (const key of keys) {
        await storage.removeItem(key);
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
          const data = await storage.getItem(key);
          if (!data) continue;

          const state = serializer.deserialize(data);
          if (!state) continue;

          instances.push({ instanceId: state.__meta?.instanceId, state });
        } catch {
          // Skip invalid entries
          // biome-ignore lint/complexity/noUselessContinue: defensive programming
          continue;
        }
      }

      return instances;
    },

    formatKey,
  } satisfies KVFlowStore;
}
