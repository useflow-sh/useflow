/**
 * Flow types
 * These types work with React, Vue, Svelte, or vanilla JS
 */

// Base context type - allows users to define their own context shape
// biome-ignore lint/suspicious/noExplicitAny: Users define their own context shape, base type must be flexible
export type FlowContext = Record<string, any>;

/**
 * Context update
 * - Partial object: shallow merges with current context
 * - Updater function: receives current context, returns new context (full control)
 */
export type ContextUpdate<TContext extends FlowContext = FlowContext> =
  | Partial<TContext>
  | ((current: TContext) => TContext);

/**
 * Step transition configuration
 * - string: Single static destination - component calls next() with no args
 * - string[]: Multiple destinations - requires either:
 *   - resolve function for context-driven branching, OR
 *   - component calls next('target') with explicit target for component-driven branching
 */
export type StepTransition = string | readonly string[];

/**
 * Step definition with optional context resolver
 * Component is added by framework-specific packages
 */
export type StepDefinition<
  TContext extends FlowContext = FlowContext,
  TNext extends StepTransition = StepTransition,
> = TNext extends readonly string[]
  ? {
      /**
       * Next step(s) this step can navigate to - Array for branching
       */
      next: TNext;

      /**
       * Optional resolver for context-driven branching
       * When next is an array, this function determines which step to navigate to
       * Must return one of the step names from the next array
       *
       * If next is an array and no resolve is provided, component MUST call next() with explicit target
       *
       * Type-safe: return type is constrained to the values in the next array
       *
       * @param context - Current flow context
       * @returns One of the step names from next, or undefined to stay on current step
       */
      resolve?: (context: TContext) => TNext[number] | undefined;
    }
  : {
      /**
       * Next step(s) this step can navigate to
       * - string: Single destination - component calls next() with no args
       * - undefined: Terminal step (flow complete)
       */
      next?: TNext;

      /**
       * resolve is not available for non-array next (use with array next only)
       */
      resolve?: never;
    };

/**
 * Persistable flow state - can be serialized to JSON
 * Includes optional metadata for versioning, TTL, etc.
 *
 * Note: This type accepts any FlowContext. Type safety is enforced
 * at the Flow component level, not at the storage/persister level.
 */
export type PersistedFlowState<TContext extends FlowContext = FlowContext> = {
  stepId: string;
  context: TContext;
  history: string[];
  status: "active" | "complete";
  __meta?: {
    savedAt?: number;
    version?: string;
    [key: string]: unknown;
  };
};

/**
 * A specific instance of a persisted flow with its identifiers
 * Stores the complete flow instance with all identifying information
 * This is what gets physically stored - the data is self-describing
 */
export type PersistedFlowInstance<TContext extends FlowContext = FlowContext> =
  {
    flowId: string;
    instanceId: string;
    variantId: string;
    state: PersistedFlowState<TContext>;
  };

/**
 * Flow definition
 * Simple declarative object defining steps and transitions
 *
 * Use 'as const' to preserve literal types for type-safe resolve functions
 */
export type FlowDefinition<
  TContext extends FlowContext = FlowContext,
  TSteps extends Record<
    string,
    StepDefinition<TContext, StepTransition>
  > = Record<string, StepDefinition<TContext, StepTransition>>,
> = {
  id: string;
  start: string;
  steps: TSteps;

  /**
   * Schema version for the flow (string, e.g., "v1", "v2", "2024-01")
   * Used for migration when flow structure changes between app versions
   *
   * When making breaking changes, update this version string and provide
   * a migration function to transform old persisted state.
   *
   * @optional
   */
  version?: string;

  /**
   * Variant identifier for this flow
   * Used to distinguish between structural variations of the same flow
   * (e.g., "standard", "express", "extended" variants of an onboarding flow)
   *
   * @optional
   */
  variantId?: string;

  /**
   * Migration function to transform persisted state from old versions
   * Called when persisted state version doesn't match current version
   *
   * **IMPORTANT:** If you use persistence, you MUST handle migrations properly when making
   * breaking changes to your flow. Breaking changes include:
   * - Renaming or removing context fields
   * - Renaming or removing steps
   * - Changing the flow structure
   *
   * Without proper migrations, users with old persisted state will experience errors or
   * lose their progress. Always update `version` (e.g., "v1" → "v2") and provide a
   * `migrate` function when making breaking changes.
   *
   * Receives the full persisted state (stepId, context, history, status) to allow
   * migrations that need to update step names, history, or other fields beyond context.
   *
   * @param persistedState - The saved state with old version (includes all fields)
   * @param fromVersion - The version of the persisted state (from __meta.version)
   * @returns Migrated state with updated fields, or null to discard
   *
   * @example
   * ```ts
   * // Example 1: Simple context migration
   * const flow = defineFlow({
   *   id: 'onboarding',
   *   version: 'v2',
   *   migrate: (state, fromVersion) => {
   *     if (fromVersion === 'v1') {
   *       return {
   *         ...state,
   *         context: {
   *           ...state.context,
   *           emailAddress: state.context.email, // Renamed field
   *         },
   *       };
   *     }
   *     return null; // Unknown version, discard
   *   },
   *   start: 'welcome',
   *   steps: { ... }
   * });
   *
   * // Example 2: Migration with step name changes
   * const flow = defineFlow({
   *   id: 'onboarding',
   *   version: 'v3',
   *   migrate: (state, fromVersion) => {
   *     if (fromVersion === 'v2') {
   *       // Renamed step: 'userProfile' -> 'profile'
   *       return {
   *         ...state,
   *         stepId: state.stepId === 'userProfile' ? 'profile' : state.stepId,
   *         history: state.history.map(s => s === 'userProfile' ? 'profile' : s),
   *       };
   *     }
   *     return null;
   *   },
   *   start: 'welcome',
   *   steps: { ... }
   * });
   * ```
   */
  migrate?: (
    persistedState: PersistedFlowState<TContext>,
    fromVersion: string | undefined,
  ) => PersistedFlowState<TContext> | null;
};

/**
 * Flow state snapshot
 * Represents the current state of a flow at a point in time
 */
export type FlowState<TContext extends FlowContext = FlowContext> = {
  stepId: string;
  context: TContext;
  history: string[];
  status: "active" | "complete";
};

/**
 * Flow actions
 * Actions that can be dispatched to modify flow state
 */
export type FlowAction<TContext extends FlowContext = FlowContext> =
  | { type: "NEXT"; target?: string; update?: ContextUpdate<TContext> }
  | { type: "BACK" }
  | { type: "SET_CONTEXT"; update: ContextUpdate<TContext> }
  | { type: "RESTORE"; state: FlowState<TContext> }
  | { type: "RESET"; initialContext: TContext };
