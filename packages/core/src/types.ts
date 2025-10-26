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
 * - string: Single static destination
 * - string[]: Multiple possible destinations (component-driven branching)
 * - function: Dynamic destination based on context (context-driven branching)
 */
export type StepTransition<TContext extends FlowContext = FlowContext> =
  | string
  | string[]
  | ((context: TContext) => string | undefined);

/**
 * Step definition
 * Component is added by framework-specific packages
 */
export type StepDefinition<TContext extends FlowContext = FlowContext> = {
  next?: StepTransition<TContext>;
};

/**
 * Flow definition
 * Simple declarative object defining steps and transitions
 */
export type FlowDefinition<TContext extends FlowContext = FlowContext> = {
  id: string;
  start: string;
  steps: Record<string, StepDefinition<TContext>>;
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
  | { type: "SET_CONTEXT"; update: ContextUpdate<TContext> };
