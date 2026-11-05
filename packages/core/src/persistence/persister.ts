import type { FlowContext, FlowState, PersistedFlowState } from "../types";
import type { FlowStore } from "./store";

export type FlowRestoreDiscardReason =
  | "expired"
  | "version_unmigrated"
  | "migration_rejected"
  | "validation_rejected"
  | "incompatible_state";

export interface FlowRestoreDiscardEvent {
  flowId: string;
  reason: FlowRestoreDiscardReason;
  fromVersion?: string;
  toVersion?: string;
  instanceId?: string;
  variantId?: string;
  errors?: string[];
}

/**
 * Flow persister interface
 * Defines how to save and restore flow state for a specific flow
 *
 * Framework adapters should re-export this type
 */
export interface FlowPersister {
  /**
   * The underlying store used by this persister
   * Useful for debugging, inspecting state, and direct store operations
   */
  store: FlowStore;

  /**
   * Save flow state for a specific flow ID
   * Can be sync or async
   *
   * @param flowId - Unique identifier for the flow
   * @param state - The flow state to persist
   * @param options - Optional save options (version, instanceId, and variantId)
   */
  save(
    flowId: string,
    state: FlowState,
    options?: {
      version?: string;
      instanceId?: string;
      variantId?: string;
    },
  ): PersistedFlowState | Promise<PersistedFlowState | null> | null;

  /**
   * Restore flow state for a specific flow ID
   * Returns null if no saved state exists
   *
   * @param flowId - Unique identifier for the flow
   * @param options - Optional restore options (version, instanceId, variantId, and migration)
   */
  restore<TContext extends FlowContext = FlowContext>(
    flowId: string,
    options?: {
      version?: string;
      instanceId?: string;
      variantId?: string;
      onDiscard?: (event: FlowRestoreDiscardEvent) => void;
      migrate?: (
        state: PersistedFlowState<TContext>,
        fromVersion: string | undefined,
      ) => PersistedFlowState<TContext> | null;
    },
  ):
    | PersistedFlowState<TContext>
    | null
    | Promise<PersistedFlowState<TContext> | null>;

  /**
   * Remove saved state for a specific flow instance
   * Optional - if not provided, users can't remove programmatically
   *
   * @param flowId - Unique identifier for the flow
   * @param options - Optional options (instanceId and variantId)
   */
  remove?(
    flowId: string,
    options?: {
      instanceId?: string;
      variantId?: string;
    },
  ): void | Promise<void>;

  /**
   * Remove all instances of a specific flow (base + all instances)
   * Optional - only available if store supports it
   *
   * @param flowId - Unique identifier for the flow
   */
  removeFlow?(flowId: string): void | Promise<void>;

  /**
   * Remove all flows managed by this persister
   * Optional - only available if store supports it
   */
  removeAll?(): void | Promise<void>;
}

/**
 * Options for persisters
 */
export type PersisterOptions = {
  /**
   * Store implementation for persisting flow state
   */
  store: FlowStore;

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

  onDiscard?: (event: FlowRestoreDiscardEvent) => void;

  /**
   * Error handler
   */
  onError?: (error: Error) => void;
};

/**
 * Generic factory for creating persisters from stores
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
 * import { createPersister } from '@useflow/core';
 *
 * // With validation and callbacks
 * const persister = createPersister({
 *   store: myStore,
 *   validate: (state) => state.stepId !== 'invalid',
 *   onSave: (flowId, state) => console.log('Saved:', flowId),
 *   onError: (error) => console.error('Error:', error),
 * });
 * ```
 */
export function createPersister(options: PersisterOptions): FlowPersister {
  const { store, ttl, validate, onSave, onRestore, onDiscard, onError } =
    options;

  return {
    store,

    save: async (flowId, state, saveOptions) => {
      try {
        const withMeta: PersistedFlowState = {
          ...state,
          __meta: {
            savedAt: Date.now(),
            version: saveOptions?.version,
          },
        };
        await store.set(flowId, withMeta, {
          instanceId: saveOptions?.instanceId,
          variantId: saveOptions?.variantId,
        });
        onSave?.(flowId, withMeta);
        return withMeta;
      } catch (error) {
        onError?.(error as Error);
        return null;
      }
    },

    restore: async <TContext extends FlowContext = FlowContext>(
      flowId: string,
      restoreOptions?: {
        version?: string;
        instanceId?: string;
        variantId?: string;
        onDiscard?: (event: FlowRestoreDiscardEvent) => void;
        migrate?: (
          state: PersistedFlowState<TContext>,
          fromVersion: string | undefined,
        ) => PersistedFlowState<TContext> | null;
      },
    ) => {
      try {
        const state = await store.get(flowId, {
          instanceId: restoreOptions?.instanceId,
          variantId: restoreOptions?.variantId,
        });
        if (!state) return null;

        // Cast to the typed version - store doesn't enforce type safety
        const typedState = state as PersistedFlowState<TContext>;
        const fromVersion = typedState.__meta?.version;
        const discard = (reason: FlowRestoreDiscardReason) => {
          try {
            (restoreOptions?.onDiscard ?? onDiscard)?.({
              flowId,
              reason,
              fromVersion,
              toVersion: restoreOptions?.version,
              instanceId: restoreOptions?.instanceId,
              variantId: restoreOptions?.variantId,
            });
          } catch (error) {
            try {
              if (onError) {
                onError(
                  error instanceof Error ? error : new Error(String(error)),
                );
              } else if (process.env.NODE_ENV !== "production") {
                console.warn("[useFlow] onDiscard callback failed:", error);
              }
            } catch (reportError) {
              if (process.env.NODE_ENV !== "production") {
                console.warn("[useFlow] onError callback failed:", reportError);
              }
            }
          }
        };

        // TTL check
        if (ttl && typedState.__meta?.savedAt) {
          const age = Date.now() - typedState.__meta.savedAt;
          if (age > ttl) {
            await store.remove(flowId, {
              instanceId: restoreOptions?.instanceId,
              variantId: restoreOptions?.variantId,
            });
            discard("expired");
            return null;
          }
        }

        // Version check and migration
        if (
          restoreOptions?.version &&
          typedState.__meta?.version !== restoreOptions.version
        ) {
          // If migrate function exists, try to migrate
          if (restoreOptions?.migrate) {
            const migrated = restoreOptions.migrate(
              typedState,
              typedState.__meta?.version,
            );
            if (!migrated) {
              // Migration failed or returned null, discard state
              discard("migration_rejected");
              return null;
            }
            onRestore?.(flowId, migrated);
            return migrated;
          }
          // No migration function, discard old version
          discard("version_unmigrated");
          return null;
        }

        // Custom validation
        if (validate && !validate(typedState)) {
          discard("validation_rejected");
          return null;
        }

        onRestore?.(flowId, typedState);
        return typedState;
      } catch (error) {
        onError?.(error as Error);
        return null;
      }
    },

    remove: async (flowId, options) => {
      try {
        await store.remove(flowId, options);
      } catch (error) {
        onError?.(error as Error);
      }
    },

    removeFlow: store.removeFlow
      ? async (flowId) => {
          try {
            await store.removeFlow?.(flowId);
          } catch (error) {
            onError?.(error as Error);
          }
        }
      : undefined,

    removeAll: store.removeAll
      ? async () => {
          try {
            await store.removeAll?.();
          } catch (error) {
            onError?.(error as Error);
          }
        }
      : undefined,
  };
}
