import type { FlowState, PersistedFlowState } from "../types";
import type { FlowStorage } from "./storage";

/**
 * Flow persister interface
 * Defines how to save and restore flow state for a specific flow
 *
 * Framework adapters should re-export this type
 */
export interface FlowPersister {
  /**
   * Save flow state for a specific flow ID
   * Can be sync or async
   *
   * @param flowId - Unique identifier for the flow
   * @param state - The flow state to persist
   * @param options - Optional save options (version and instanceId)
   */
  save(
    flowId: string,
    state: FlowState,
    options?: {
      version?: string;
      instanceId?: string;
    },
  ): PersistedFlowState | Promise<PersistedFlowState | null> | null;

  /**
   * Restore flow state for a specific flow ID
   * Returns null if no saved state exists
   *
   * @param flowId - Unique identifier for the flow
   * @param options - Optional restore options (version, instanceId, and migration)
   */
  restore(
    flowId: string,
    options?: {
      version?: string;
      instanceId?: string;
      migrate?: (
        state: PersistedFlowState,
        fromVersion: string | undefined,
      ) => PersistedFlowState | null;
    },
  ): PersistedFlowState | null | Promise<PersistedFlowState | null>;

  /**
   * Remove saved state for a specific flow instance
   * Optional - if not provided, users can't remove programmatically
   *
   * @param flowId - Unique identifier for the flow
   * @param instanceId - Optional instance identifier
   */
  remove?(flowId: string, instanceId?: string): void | Promise<void>;

  /**
   * Remove all instances of a specific flow (base + all instances)
   * Optional - only available if storage adapter supports it
   *
   * @param flowId - Unique identifier for the flow
   */
  removeFlow?(flowId: string): void | Promise<void>;

  /**
   * Remove all flows managed by this persister
   * Optional - only available if storage adapter supports it
   * Only removes flows with the configured prefix
   */
  removeAll?(): void | Promise<void>;
}

/**
 * Options for storage-based persisters
 */
export type PersisterOptions = {
  /**
   * Storage implementation for persisting flow state
   */
  storage: FlowStorage;

  /**
   * Custom validation function (read-only)
   * Return false to reject the persisted state
   *
   * Note: This function should NOT mutate the state.
   * For transformations, define a migrate function in your flow config.
   */
  validate?: (state: Readonly<PersistedFlowState>) => boolean;

  /**
   * Time-to-live in milliseconds
   * State older than this will be ignored
   */
  ttl?: number;

  /**
   * Called when state is successfully saved
   */
  onSave?: (flowId: string, state: PersistedFlowState) => void;

  /**
   * Called when state is successfully restored
   */
  onRestore?: (flowId: string, state: PersistedFlowState) => void;

  /**
   * Error handler
   */
  onError?: (error: Error) => void;
};

/**
 * Generic factory for creating persisters from storage backends
 * Handles all common logic (TTL, versioning, validation)
 *
 * This is framework-agnostic and can be used across React, Vue, Svelte, etc.
 *
 * **IMPORTANT:** Once you enable persistence, you MUST handle migrations properly
 * when making breaking changes to your flow. Define `version` and `migrate` in your
 * flow config to handle schema changes. Without proper migrations, users with old
 * persisted state will encounter errors.
 *
 * @example
 * ```ts
 * import { createPersister, kvJsonStorageAdapter } from '@useflow/core';
 *
 * // Web (localStorage)
 * const persister = createPersister({
 *   storage: kvJsonStorageAdapter({
 *     store: localStorage,
 *     getKey: (flowId) => `myapp:${flowId}`
 *   }),
 *   ttl: 7 * 24 * 60 * 60 * 1000,
 * });
 *
 * // Custom SQL storage
 * const persister = createPersister({
 *   storage: createPostgresStorage(db),
 * });
 * ```
 */
export function createPersister(options: PersisterOptions): FlowPersister {
  const { storage, ttl, validate, onSave, onRestore, onError } = options;

  return {
    save: async (flowId, state, saveOptions) => {
      try {
        const withMeta: PersistedFlowState = {
          ...state,
          __meta: {
            savedAt: Date.now(),
            version: saveOptions?.version,
            instanceId: saveOptions?.instanceId,
          },
        };
        await storage.set(flowId, withMeta, saveOptions?.instanceId);
        onSave?.(flowId, withMeta);
        return withMeta;
      } catch (error) {
        onError?.(error as Error);
        return null;
      }
    },

    restore: async (flowId, restoreOptions) => {
      try {
        const state = await storage.get(flowId, restoreOptions?.instanceId);
        if (!state) return null;

        // TTL check
        if (ttl && state.__meta?.savedAt) {
          const age = Date.now() - state.__meta.savedAt;
          if (age > ttl) {
            await storage.remove(flowId, restoreOptions?.instanceId);
            return null;
          }
        }

        // Version check and migration
        if (
          restoreOptions?.version &&
          state.__meta?.version !== restoreOptions.version
        ) {
          // If migrate function exists, try to migrate
          if (restoreOptions?.migrate) {
            const migrated = restoreOptions.migrate(
              state,
              state.__meta?.version,
            );
            if (!migrated) {
              // Migration failed or returned null, discard state
              return null;
            }
            onRestore?.(flowId, migrated);
            return migrated;
          }
          // No migration function, discard old version
          return null;
        }

        // Custom validation
        if (validate && !validate(state)) {
          return null;
        }

        onRestore?.(flowId, state);
        return state;
      } catch (error) {
        onError?.(error as Error);
        return null;
      }
    },

    remove: async (flowId, instanceId) => {
      try {
        await storage.remove(flowId, instanceId);
      } catch (error) {
        onError?.(error as Error);
      }
    },

    removeFlow: storage.removeFlow
      ? async (flowId) => {
          try {
            await storage.removeFlow?.(flowId);
          } catch (error) {
            onError?.(error as Error);
          }
        }
      : undefined,

    removeAll: storage.removeAll
      ? async () => {
          try {
            await storage.removeAll?.();
          } catch (error) {
            onError?.(error as Error);
          }
        }
      : undefined,
  };
}
