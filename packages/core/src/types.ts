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
 * Step definition - purely declarative structure
 * Component is added by framework-specific packages
 *
 * Note: Resolver functions are defined separately in the runtime configuration
 * to keep this type serializable for remote configs
 */
export type StepDefinition<TNext extends StepTransition = StepTransition> = {
  /**
   * Next step(s) this step can navigate to
   * - string: Single destination - component calls next() with no args
   * - string[]: Multiple destinations - requires either:
   *   - Resolver function (defined in runtime config), OR
   *   - Component calls next('target') with explicit target
   * - undefined: Terminal step (flow complete)
   */
  next?: TNext;
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
 * Flow definition - purely declarative, JSON-serializable structure
 * No runtime functions (migrate, resolve) - those are defined separately
 * in the runtime configuration to enable remote configs
 *
 * Use 'as const' to preserve literal types for type-safe step references
 */
export type FlowDefinition<
  _TContext extends FlowContext = FlowContext,
  TSteps extends Record<string, StepDefinition<StepTransition>> = Record<
    string,
    StepDefinition<StepTransition>
  >,
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
