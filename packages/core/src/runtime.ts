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
 * @example
 * ```ts
 * // Example 1: Simple context migration
 * const flow = defineFlow(
 *   {
 *     id: 'onboarding',
 *     version: 'v2',
 *     start: 'welcome',
 *     steps: { ... }
 *   },
 *   (steps) => ({
 *     migrate: (state, fromVersion) => {
 *       if (fromVersion === 'v1') {
 *         return {
 *           ...state,
 *           context: {
 *             ...state.context,
 *             emailAddress: state.context.email, // Renamed field
 *           },
 *         };
 *       }
 *       return null; // Unknown version, discard
 *     }
 *   })
 * );
 *
 * // Example 2: Migration with step name changes
 * const flow = defineFlow(
 *   {
 *     id: 'onboarding',
 *     version: 'v3',
 *     start: 'welcome',
 *     steps: { ... }
 *   },
 *   (steps) => ({
 *     migrate: (state, fromVersion) => {
 *       if (fromVersion === 'v2') {
 *         // Renamed step: 'userProfile' -> 'profile'
 *         return {
 *           ...state,
 *           stepId: state.stepId === 'userProfile' ? steps.profile : state.stepId,
 *           history: state.history.map(s => s === 'userProfile' ? steps.profile : s),
 *         };
 *       }
 *       return null;
 *     }
 *   })
 * );
 * ```
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
 * @example
 * ```ts
 * const flow = defineFlow(
 *   {
 *     steps: {
 *       userType: { next: ['business', 'personal'] }
 *     }
 *   },
 *   (steps) => ({
 *     resolve: {
 *       userType: (ctx) =>
 *         ctx.type === 'business'
 *           ? steps.business
 *           : steps.personal
 *     }
 *   })
 * );
 * ```
 */
export type ResolveFunction<
  TContext extends FlowContext = FlowContext,
  TNextSteps extends string = string,
> = (context: TContext) => TNextSteps | undefined;

/**
 * Map of step IDs to their resolver functions
 * Only steps with array-based next transitions need resolvers
 *
 * @example
 * ```ts
 * const resolvers: ResolverMap = {
 *   userType: (ctx) => ctx.type === 'business' ? 'business' : 'personal',
 *   setupPreference: (ctx) => ctx.setup === 'advanced' ? 'advanced' : 'complete'
 * };
 * ```
 */
export type ResolverMap<TContext extends FlowContext = FlowContext> = Record<
  string,
  ResolveFunction<TContext, string>
>;

/**
 * Step references object - provides type-safe references to step names
 * Each step becomes a property with its name as both key and value
 *
 * This enables refactor-safe step references in migrate and resolve functions:
 * - `steps.business` instead of `"business"` (string literal)
 * - Autocomplete support
 * - Renaming steps updates all references automatically
 *
 * @example
 * ```ts
 * // Instead of error-prone strings:
 * resolve: {
 *   userType: (ctx) => ctx.type === 'business' ? 'business' : 'personal'
 * }
 *
 * // Use type-safe step references:
 * (steps) => ({
 *   resolve: {
 *     userType: (ctx) => ctx.type === 'business' ? steps.business : steps.personal
 *   }
 * })
 * ```
 */
export type StepRefs<TSteps extends Record<string, unknown>> = {
  [K in keyof TSteps]: K;
};

/**
 * Runtime configuration builder
 * Callback that receives type-safe step references and returns runtime behaviors
 *
 * @param steps - Object with step names as properties (for type-safe references)
 * @returns Runtime configuration with migrate and/or resolve functions
 *
 * @example
 * ```ts
 * const flow = defineFlow(
 *   {
 *     id: 'onboarding',
 *     version: 'v2',
 *     start: 'welcome',
 *     steps: {
 *       welcome: { next: 'userType' },
 *       userType: { next: ['business', 'personal'] },
 *       business: { next: 'complete' },
 *       personal: { next: 'complete' },
 *       complete: {}
 *     }
 *   },
 *   (steps) => ({  // ← steps.welcome, steps.business, etc.
 *     migrate: (state, version) => {
 *       if (version === 'v1') {
 *         return {
 *           ...state,
 *           stepId: state.stepId === 'old' ? steps.welcome : state.stepId
 *         };
 *       }
 *       return null;
 *     },
 *     resolve: {
 *       userType: (ctx) =>
 *         ctx.type === 'business'
 *           ? steps.business
 *           : steps.personal
 *     }
 *   })
 * );
 * ```
 */
export type FlowRuntimeConfig<
  // biome-ignore lint/suspicious/noExplicitAny: Generic constraint allows any context and step types
  TDefinition extends FlowDefinition<any, any>,
  TContext extends FlowContext = FlowContext,
> = (steps: StepRefs<TDefinition["steps"]>) => {
  migrate?: MigrateFunction<TContext>;
  resolve?: ResolverMap<TContext>;
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
  // biome-ignore lint/suspicious/noExplicitAny: Generic constraint allows any context and step types for flexible flow definitions
  TDefinition extends FlowDefinition<any, any> = FlowDefinition<any, any>,
  TContext extends FlowContext = FlowContext,
> = {
  id: string;
  config: TDefinition;
  runtimeConfig?: {
    migrate?: MigrateFunction<TContext>;
    resolvers?: ResolverMap<TContext>;
  };
};
