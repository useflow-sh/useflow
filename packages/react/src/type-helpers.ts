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
 * - For arrays: extracts union of step names
 * - For strings: returns the string literal
 * - For functions: returns all step names (can't extract statically)
 */
export type ValidNextSteps<
  TConfig,
  TStep extends StepNames<TConfig>,
> = TConfig extends { steps: infer S }
  ? TStep extends keyof S
    ? S[TStep] extends { next: infer N }
      ? N extends readonly (infer E)[]
        ? E // Array: extract union type
        : N extends string
          ? N // String: use as-is
          : StepNames<TConfig> // Function: allow any step (can't infer statically)
      : never
    : never
  : never;
