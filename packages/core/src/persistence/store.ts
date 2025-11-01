import type { PersistedFlowInstance, PersistedFlowState } from "../types";

/**
 * Options for flow store operations
 */
export type FlowStoreOptions = {
  instanceId?: string;
  variantId?: string;
};

/**
 * Flow store interface
 * Stores implement this to persist flow state
 *
 * Methods can be sync or async to support different backends:
 * - Web: localStorage, sessionStorage, IndexedDB
 * - React Native: AsyncStorage, MMKV
 * - Node.js: file system, databases
 * - Custom: API endpoints, cloud storage
 *
 * Note: Store is not typed with a specific context type - it works with any context type.
 * Type safety is enforced at the Flow component level.
 */
export interface FlowStore {
  /**
   * Get flow state by flow ID with optional instance ID and variant ID
   * @param flowId - Flow identifier
   * @param options - Optional instance and variant identifiers
   * @returns Flow state or null if not found
   */
  get(
    flowId: string,
    options?: FlowStoreOptions,
  ): Promise<PersistedFlowState | null> | PersistedFlowState | null;

  /**
   * Save flow state
   * @param flowId - Flow identifier
   * @param state - Flow state to persist
   * @param options - Optional instance and variant identifiers
   */
  set(
    flowId: string,
    state: PersistedFlowState,
    options?: FlowStoreOptions,
  ): Promise<void> | void;

  /**
   * Remove specific flow instance
   * @param flowId - Flow identifier
   * @param options - Optional instance and variant identifiers
   */
  remove(flowId: string, options?: FlowStoreOptions): Promise<void> | void;

  /**
   * Remove all instances of a flow (base + all instances)
   * @param flowId - Flow identifier
   */
  removeFlow?(flowId: string): Promise<void> | void;

  /**
   * Remove all flows managed by this store
   */
  removeAll?(): Promise<void> | void;

  /**
   * List all instances of a flow
   * @param flowId - Flow identifier
   * @returns Array of flow instances with their identifiers and states
   *
   * @example
   * ```ts
   * const instances = await store.list("onboarding");
   * // [
   * //   { instanceId: "default", variantId: "default", state: {...} },
   * //   { instanceId: "default", variantId: "standard", state: {...} },
   * //   { instanceId: "session-1", variantId: "express", state: {...} }
   * // ]
   * ```
   */
  list?(
    flowId: string,
  ): Promise<PersistedFlowInstance[]> | PersistedFlowInstance[];
}

/**
 * Extended FlowStore interface for key-value based stores
 *
 * This interface extends FlowStore with a formatKey() method that exposes
 * the store key format. This is useful for:
 * - Debugging and inspection tools
 * - Logging store operations
 * - Manual key inspection in dev tools
 * - Data migration utilities
 *
 * Implement this interface if your store implementation uses string keys
 * (localStorage, sessionStorage, Redis, etc.)
 *
 * @example
 * ```ts
 * const store: KVFlowStore = createMyKVStore();
 *
 * // Can inspect the actual key being used
 * const key = store.formatKey("onboarding");
 * console.log(key); // Implementation-dependent format
 *
 * // With instance ID and variant ID
 * const instanceKey = store.formatKey("onboarding", "user-123", "standard");
 * console.log(instanceKey); // Implementation-dependent format
 * ```
 */
export interface KVFlowStore extends FlowStore {
  /**
   * Format a store key for a flow ID with optional instance ID and variant ID
   * @param flowId - Flow identifier
   * @param options - Optional instance and variant identifiers
   * @returns The store key to use for this flow
   */
  formatKey(flowId: string, options?: FlowStoreOptions): string;
}
