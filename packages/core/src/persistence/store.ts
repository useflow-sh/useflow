import type { PersistedFlowState } from "../types";

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
   * Get flow state by flow ID and optional instance ID
   * @param flowId - Flow identifier
   * @param instanceId - Optional instance identifier for reusable flows
   * @returns Flow state or null if not found
   */
  get(
    flowId: string,
    instanceId?: string,
  ): Promise<PersistedFlowState | null> | PersistedFlowState | null;

  /**
   * Save flow state
   * @param flowId - Flow identifier
   * @param state - Flow state to persist
   * @param instanceId - Optional instance identifier for reusable flows
   */
  set(
    flowId: string,
    state: PersistedFlowState,
    instanceId?: string,
  ): Promise<void> | void;

  /**
   * Remove specific flow instance
   * @param flowId - Flow identifier
   * @param instanceId - Optional instance identifier
   */
  remove(flowId: string, instanceId?: string): Promise<void> | void;

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
   * @returns Array of instance IDs and their states
   *
   * @example
   * ```ts
   * const instances = await store.list("task-flow");
   * // [
   * //   { instanceId: undefined, state: {...} },  // Base flow without instanceId
   * //   { instanceId: "task-123", state: {...} },
   * //   { instanceId: "task-456", state: {...} }
   * // ]
   * ```
   */
  list?(
    flowId: string,
  ):
    | Promise<
        Array<{ instanceId: string | undefined; state: PersistedFlowState }>
      >
    | Array<{ instanceId: string | undefined; state: PersistedFlowState }>;
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
 * // With instance ID
 * const instanceKey = store.formatKey("onboarding", "user-123");
 * console.log(instanceKey); // Implementation-dependent format
 * ```
 */
export interface KVFlowStore extends FlowStore {
  /**
   * Format a store key for a flow ID and optional instance ID
   * @param flowId - Flow identifier
   * @param instanceId - Optional instance identifier for reusable flows
   * @returns The store key to use for this flow
   */
  formatKey(flowId: string, instanceId?: string): string;
}
