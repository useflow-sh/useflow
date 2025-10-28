import type { PersistedFlowState } from "./state";

/**
 * Flow storage interface
 * Storage backends implement this to persist flow state
 *
 * Methods can be sync or async to support different backends:
 * - Web: localStorage, sessionStorage, IndexedDB
 * - React Native: AsyncStorage, MMKV
 * - Node.js: file system, databases
 * - Custom: API endpoints, cloud storage
 *
 * Note: Storage is not generic - it works with any context type.
 * Type safety is enforced at the Flow component level.
 */
export interface FlowStorage {
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
   * Remove all flows managed by this storage adapter
   */
  removeAll?(): Promise<void> | void;
}

/**
 * Extended FlowStorage interface for key-value based storage adapters
 *
 * This interface extends FlowStorage with a getKey() method that exposes
 * the storage key format. This is useful for:
 * - Debugging and inspection tools
 * - Logging storage operations
 * - Manual key inspection in dev tools
 * - Data migration utilities
 *
 * Implement this interface if your storage adapter uses string keys
 * (localStorage, sessionStorage, Redis, etc.)
 *
 * @example
 * ```ts
 * const storage: KVFlowStorage = kvJsonStorageAdapter({
 *   store: localStorage,
 *   prefix: "myapp"
 * });
 *
 * // Can inspect the actual key being used
 * const key = storage.getKey("onboarding");
 * console.log(key); // "myapp:onboarding"
 * ```
 */
export interface KVFlowStorage extends FlowStorage {
  /**
   * Get the storage key for a flow ID and optional instance ID
   * @param flowId - Flow identifier
   * @param instanceId - Optional instance identifier for reusable flows
   * @returns The storage key used for this flow
   */
  getKey(flowId: string, instanceId?: string): string;
}
