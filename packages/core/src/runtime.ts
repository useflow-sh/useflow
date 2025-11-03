/**
 * Runtime configuration types for flow definitions
 *
 * These types define client-side behaviors that cannot be serialized
 * (migrate functions, resolver functions, etc.)
 *
 * This separation allows FlowDefinition to be pure JSON for remote configs,
 * while still supporting runtime behaviors in client applications.
 */

import type { FlowContext, FlowDefinition, PersistedFlowState } from "./types";

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
 * @param state - The saved state with old version (includes all fields)
 * @param fromVersion - The version of the persisted state (from __meta.version)
 * @returns Migrated state with updated fields, or null to discard
 *
 * @see defineFlow() for usage examples
 */
export type MigrateFunction<TContext extends FlowContext = FlowContext> = (
  state: PersistedFlowState<TContext>,
  fromVersion: string | undefined,
) => PersistedFlowState<TContext> | null;

/**
 * Resolver function for context-driven step branching
 * When a step has multiple possible next steps (array), this function
 * determines which step to navigate to based on the current context
 *
 * @param context - Current flow context
 * @returns One of the step names from the next array, or undefined to stay on current step
 *
 * @see defineFlow() for usage examples
 */
export type ResolveFunction<
  TContext extends FlowContext = FlowContext,
  TNextSteps extends string = string,
> = (context: TContext) => TNextSteps | undefined;

/**
 * Runtime resolver map - looser type used internally by the reducer
 * This allows runtime operations without strict step type constraints
 */
export type RuntimeResolverMap<TContext extends FlowContext = FlowContext> =
  Record<string, ResolveFunction<TContext, string>>;

/**
 * Type-safe resolver map for flow definitions
 * Only steps with array-based next transitions need resolvers
 *
 * Each resolver is constrained to return only the valid next steps defined
 * for that specific step in the flow configuration.
 *
 * The resolver functions can accept any context type (allowing for more specific
 * context types in individual resolvers), but must return one of the valid next steps.
 *
 * @see defineFlow() for usage examples
 */
export type ResolverMap<
  // biome-ignore lint/suspicious/noExplicitAny: Generic constraint allows any step definition shape
  TSteps extends Record<string, any> = Record<string, any>,
  TContext extends FlowContext = FlowContext,
> = {
  [K in keyof TSteps]?: TSteps[K] extends { next: infer N }
    ? N extends readonly (infer E)[]
      ? (context: TContext) => (E & string) | undefined
      : never
    : never;
};

/**
 * Step references object - provides type-safe references to step names
 * Each step becomes a property with its name as both key and value
 *
 * This enables refactor-safe step references in migrate and resolve functions:
 * - `steps.business` instead of `"business"` (string literal)
 * - Autocomplete support
 * - Renaming steps updates all references automatically
 *
 * @see defineFlow() for usage examples
 */
export type StepRefs<TSteps extends Record<string, unknown>> = {
  [K in keyof TSteps]: K;
};

/**
 * Runtime configuration builder
 * Callback that receives type-safe step references and returns runtime behaviors
 *
 * @param steps - Object with step names as properties (for type-safe references)
 * @returns Runtime configuration with migration and/or resolvers
 *
 * @see defineFlow() for usage examples
 */
export type FlowRuntimeConfig<
  TDefinition extends FlowDefinition,
  TContext extends FlowContext = FlowContext,
> = (steps: StepRefs<TDefinition["steps"]>) => {
  migration?: MigrateFunction<TContext>;
  resolvers?: ResolverMap<TDefinition["steps"], TContext>;
};

/**
 * Runtime flow definition with optional runtime configuration
 * This is what defineFlow() returns - combines the serializable config
 * with optional runtime behaviors
 *
 * @property id - Flow identifier
 * @property config - Pure, JSON-serializable flow definition (can be sent to server)
 * @property runtimeConfig - Client-side runtime behaviors (migrate, resolvers)
 */
export type RuntimeFlowDefinition<
  TDefinition extends FlowDefinition,
  TContext extends FlowContext = FlowContext,
> = {
  id: string;
  config: TDefinition;
  runtimeConfig?: {
    migration?: MigrateFunction<TContext>;
    resolvers?: ResolverMap<TDefinition["steps"], TContext>;
  };
};
