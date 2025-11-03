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
 * Action taken when leaving a step
 * Represents how the user exited/completed a step
 * - "next": Completed the step normally and moved forward
 * - "skip": Skipped the step and moved forward
 * - "back": Navigated backward to a previous step
 */
export type NavigationAction = "next" | "skip" | "back";

/**
 * Navigation history entry tracking step visits
 * Records when a user entered and exited each step
 *
 * Current step: Has startedAt but no completedAt/action (user is still there)
 * Completed steps: Have all fields (user has left)
 */
export type HistoryEntry = {
  stepId: string;
  /** When the user arrived at this step */
  startedAt: number;
  /** When the user left this step (undefined if still on this step) */
  completedAt?: number;
  /** How the user left this step: next or back (undefined if still on this step) */
  action?: NavigationAction;
};

/**
 * Path entry - same as HistoryEntry but semantically represents the navigation path
 * This is the route the user took to get to the current step (used for back navigation)
 */
export type PathEntry = HistoryEntry;

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
  /** Path taken through the flow - used for back navigation */
  path: PathEntry[];
  /** Complete navigation history with timestamps - tracks all movements */
  history: HistoryEntry[];
  status: "active" | "complete";
  /** When the flow was started (first step entered) */
  startedAt: number;
  /** When the flow was completed (undefined if still active) */
  completedAt?: number;
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
 */
export type FlowDefinition<
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
  /** Path taken through the flow - used for back navigation */
  path: PathEntry[];
  /** Complete navigation history with timestamps - tracks all movements */
  history: HistoryEntry[];
  status: "active" | "complete";
  /** When the flow was started (first step entered) */
  startedAt: number;
  /** When the flow was completed (undefined if still active) */
  completedAt?: number;
};

/**
 * Flow actions
 * Actions that can be dispatched to modify flow state
 */
export type FlowAction<TContext extends FlowContext = FlowContext> =
  | { type: "NEXT"; target?: string; update?: ContextUpdate<TContext> }
  | { type: "SKIP"; target?: string; update?: ContextUpdate<TContext> }
  | { type: "BACK" }
  | { type: "SET_CONTEXT"; update: ContextUpdate<TContext> }
  | { type: "RESTORE"; state: FlowState<TContext> }
  | { type: "RESET"; initialContext: TContext };
