/**
 * Pre-configured adapters for browser storage (localStorage and sessionStorage)
 *
 * These helpers eliminate boilerplate for common storage setups.
 * They use a default key prefix format but can be customized.
 *
 * @example
 * ```ts
 * import { createLocalStorageStore, createPersister } from "@useflow/core";
 *
 * // Simple usage with default prefix "useflow"
 * const store = createLocalStorageStore(localStorage);
 * const persister = createPersister({ store });
 *
 * // Custom prefix
 * const store = createLocalStorageStore(localStorage, { prefix: "myapp" });
 * // Keys: "myapp:flowId" or "myapp:flowId:instanceId"
 *
 * // Session storage (cleared when tab closes)
 * const store = createSessionStorageStore(sessionStorage, { prefix: "myapp" });
 * ```
 */

import { JsonSerializer, type Serializer } from "../serializer";
import { type KVStore, kvStorageAdapter } from "./kv-storage-adapter";

export type BrowserStorageOptions = {
  /**
   * Key prefix for all flow storage keys
   * @default "useflow"
   *
   * @example
   * ```ts
   * // Default: "useflow:flowId" or "useflow:flowId:instanceId"
   * createLocalStorageStore(localStorage)
   *
   * // Custom: "myapp:flowId" or "myapp:flowId:instanceId"
   * createLocalStorageStore(localStorage, { prefix: "myapp" })
   * ```
   */
  prefix?: string;

  /**
   * Custom serializer for encoding/decoding state
   * @default JsonSerializer
   *
   * @example
   * ```ts
   * import { createLocalStorageStore } from "@useflow/core";
   * import { MyCustomSerializer } from "./serializers";
   *
   * const store = createLocalStorageStore(localStorage, {
   *   serializer: MyCustomSerializer
   * });
   * ```
   */
  serializer?: Serializer<string>;
};

/**
 * Creates a FlowStore using browser localStorage
 *
 * Automatically handles:
 * - JSON serialization
 * - Key prefixing and formatting
 * - Key enumeration for removeAll/removeFlow/list operations
 *
 * @param storage - The Web Storage API object (localStorage or sessionStorage)
 * @param options - Optional configuration
 * @returns FlowStore configured for the provided storage
 *
 * @example
 * ```ts
 * import { createLocalStorageStore, createPersister } from "@useflow/core";
 *
 * // Default prefix "useflow"
 * const store = createLocalStorageStore(localStorage);
 * const persister = createPersister({ store, ttl: 7 * 24 * 60 * 60 * 1000 });
 *
 * // Custom prefix
 * const store = createLocalStorageStore(localStorage, { prefix: "myapp" });
 * // Storage keys: "myapp:onboarding", "myapp:checkout:user-123", etc.
 * ```
 */
export function createLocalStorageStore(
  storage: KVStore<string>,
  options?: BrowserStorageOptions,
) {
  const prefix = options?.prefix ?? "useflow";
  const serializer = options?.serializer ?? JsonSerializer;

  return kvStorageAdapter({
    storage,
    serializer,
    formatKey: (flowId, instanceId) =>
      instanceId ? `${prefix}:${flowId}:${instanceId}` : `${prefix}:${flowId}`,
    listKeys: (flowId) => {
      // Web Storage API requires length and key() method
      const webStorage = storage as KVStore<string> & {
        length: number;
        key: (index: number) => string | null;
      };

      // Get all keys from storage using Web Storage API
      const allKeys: string[] = [];
      for (let i = 0; i < webStorage.length; i++) {
        const key = webStorage.key(i);
        if (key) allKeys.push(key);
      }

      // If no flowId, return all keys with our prefix
      if (!flowId) return allKeys.filter((k) => k.startsWith(`${prefix}:`));

      // Filter keys for this specific flow
      const baseKey = `${prefix}:${flowId}`;
      return allKeys.filter(
        (key) => key === baseKey || key.startsWith(`${baseKey}:`),
      );
    },
  });
}

/**
 * Creates a FlowStore using browser sessionStorage
 *
 * Session storage is cleared when the browser tab/window is closed.
 * Use this for temporary flows that shouldn't persist across sessions.
 *
 * Automatically handles:
 * - JSON serialization
 * - Key prefixing and formatting
 * - Key enumeration for removeAll/removeFlow/list operations
 *
 * @param storage - The Web Storage API object (sessionStorage)
 * @param options - Optional configuration
 * @returns FlowStore configured for the provided storage
 *
 * @example
 * ```ts
 * import { createSessionStorageStore, createPersister } from "@useflow/core";
 *
 * // Cleared when tab closes
 * const store = createSessionStorageStore(sessionStorage);
 * const persister = createPersister({ store });
 *
 * // Custom prefix
 * const store = createSessionStorageStore(sessionStorage, { prefix: "myapp" });
 * ```
 */
export function createSessionStorageStore(
  storage: KVStore<string>,
  options?: BrowserStorageOptions,
) {
  const prefix = options?.prefix ?? "useflow";
  const serializer = options?.serializer ?? JsonSerializer;

  return kvStorageAdapter({
    storage,
    serializer,
    formatKey: (flowId, instanceId) =>
      instanceId ? `${prefix}:${flowId}:${instanceId}` : `${prefix}:${flowId}`,
    listKeys: (flowId) => {
      // Web Storage API requires length and key() method
      const webStorage = storage as KVStore<string> & {
        length: number;
        key: (index: number) => string | null;
      };

      // Get all keys from storage using Web Storage API
      const allKeys: string[] = [];
      for (let i = 0; i < webStorage.length; i++) {
        const key = webStorage.key(i);
        if (key) allKeys.push(key);
      }

      // If no flowId, return all keys with our prefix
      if (!flowId) return allKeys.filter((k) => k.startsWith(`${prefix}:`));

      // Filter keys for this specific flow
      const baseKey = `${prefix}:${flowId}`;
      return allKeys.filter(
        (key) => key === baseKey || key.startsWith(`${baseKey}:`),
      );
    },
  });
}
