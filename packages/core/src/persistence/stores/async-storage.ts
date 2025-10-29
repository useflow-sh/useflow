/**
 * Pre-configured adapter for React Native AsyncStorage
 *
 * This helper eliminates boilerplate for React Native apps.
 * Works with @react-native-async-storage/async-storage
 *
 * @example
 * ```ts
 * import { createAsyncStorageStore, createPersister } from "@useflow/core";
 * import AsyncStorage from "@react-native-async-storage/async-storage";
 *
 * // Simple usage with default prefix "useflow"
 * const store = createAsyncStorageStore(AsyncStorage);
 * const persister = createPersister({ store, ttl: 7 * 24 * 60 * 60 * 1000 });
 *
 * // Custom prefix
 * const store = createAsyncStorageStore(AsyncStorage, { prefix: "myapp" });
 * // Keys: "myapp:flowId" or "myapp:flowId:instanceId"
 * ```
 */

import { JsonSerializer, type Serializer } from "../serializer";
import { type KVStore, kvStorageAdapter } from "./kv-storage-adapter";

export type AsyncStorageOptions = {
  /**
   * Key prefix for all flow storage keys
   * @default "useflow"
   *
   * @example
   * ```ts
   * // Default: "useflow:flowId" or "useflow:flowId:instanceId"
   * createAsyncStorageStore(AsyncStorage)
   *
   * // Custom: "myapp:flowId" or "myapp:flowId:instanceId"
   * createAsyncStorageStore(AsyncStorage, { prefix: "myapp" })
   * ```
   */
  prefix?: string;

  /**
   * Custom serializer for encoding/decoding state
   * @default JsonSerializer
   *
   * @example
   * ```ts
   * import { createAsyncStorageStore } from "@useflow/core";
   * import AsyncStorage from "@react-native-async-storage/async-storage";
   * import { MyCustomSerializer } from "./serializers";
   *
   * const store = createAsyncStorageStore(AsyncStorage, {
   *   serializer: MyCustomSerializer
   * });
   * ```
   */
  serializer?: Serializer<string>;
};

/**
 * Creates a FlowStore using React Native AsyncStorage
 *
 * Automatically handles:
 * - JSON serialization
 * - Key prefixing and formatting
 * - Async key enumeration for removeAll/removeFlow/list operations
 *
 * @param asyncStorage - AsyncStorage instance from @react-native-async-storage/async-storage
 * @param options - Optional configuration
 * @returns FlowStore configured for AsyncStorage
 *
 * @example
 * ```ts
 * import { createAsyncStorageStore, createPersister } from "@useflow/core";
 * import AsyncStorage from "@react-native-async-storage/async-storage";
 *
 * // Default prefix "useflow"
 * const store = createAsyncStorageStore(AsyncStorage);
 * const persister = createPersister({
 *   store,
 *   ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
 *   onError: (error) => console.error('Persistence error:', error)
 * });
 *
 * // Custom prefix for namespacing
 * const store = createAsyncStorageStore(AsyncStorage, { prefix: "myapp" });
 * // Storage keys: "myapp:onboarding", "myapp:feedback:task-123", etc.
 * ```
 */
export function createAsyncStorageStore(
  asyncStorage: KVStore<string>,
  options?: AsyncStorageOptions,
) {
  const prefix = options?.prefix ?? "useflow";
  const serializer = options?.serializer ?? JsonSerializer;

  return kvStorageAdapter({
    storage: asyncStorage,
    serializer,
    formatKey: (flowId, instanceId) =>
      instanceId ? `${prefix}:${flowId}:${instanceId}` : `${prefix}:${flowId}`,
    listKeys: async (flowId) => {
      // AsyncStorage typically has getAllKeys() method on the object itself
      // Cast to any to access the getAllKeys method which isn't on KVStore interface
      const storage = asyncStorage as KVStore<string> & {
        getAllKeys?: () => Promise<readonly string[]>;
      };

      if (!storage.getAllKeys) {
        throw new Error(
          "AsyncStorage must have a getAllKeys() method. " +
            "Make sure you're passing the full AsyncStorage instance from @react-native-async-storage/async-storage",
        );
      }

      const allKeys = await storage.getAllKeys();

      // If no flowId, return all keys with our prefix
      if (!flowId)
        return allKeys.filter((k) => k.startsWith(`${prefix}:`)) as string[];

      // Filter keys for this specific flow
      const baseKey = `${prefix}:${flowId}`;
      return allKeys.filter(
        (key) => key === baseKey || key.startsWith(`${baseKey}:`),
      ) as string[];
    },
  });
}
