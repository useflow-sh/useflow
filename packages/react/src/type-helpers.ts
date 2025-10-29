import type { FlowContext, FlowDefinition } from "@useflow/core";

/**
 * FlowConfig is an alias for core's FlowDefinition
 * Used for defining flows with 'as const satisfies FlowConfig<MyContext>'
 */
export type FlowConfig<TContext extends FlowContext = FlowContext> =
  FlowDefinition<TContext>;

/**
 * Extract step names from a flow config
 */
export type StepNames<TConfig> = TConfig extends { steps: infer S }
  ? keyof S
  : never;

/**
 * Extract context type from a flow config
 */
export type ExtractContext<TConfig> = TConfig extends FlowConfig<infer C>
  ? C
  : FlowContext;

/**
 * Extract valid next step destinations for a specific step
 * - For arrays: extracts union of array element types (e.g., ["stepA", "stepB"] → "stepA" | "stepB")
 * - For strings: returns the string literal type (e.g., "stepA" → "stepA")
 * - For undefined: returns never (terminal step with no next)
 */
export type ValidNextSteps<
  TConfig,
  TStep extends StepNames<TConfig>,
> = TConfig extends { steps: infer S }
  ? TStep extends keyof S
    ? S[TStep] extends { next: infer N }
      ? N extends readonly (infer E)[]
        ? E // Array: extract union of element types
        : N extends string
          ? N // String: use as-is
          : never // No next or invalid type
      : never
    : never
  : never;
