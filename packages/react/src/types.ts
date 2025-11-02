import type {
  FlowDefinition as CoreFlowDefinition,
  RuntimeFlowDefinition as CoreRuntimeFlowDefinition,
  FlowContext,
} from "@useflow/core";
import type { ReactElement } from "react";
import type { UseFlowReducerReturn } from "./use-flow-reducer";

/**
 * React-enhanced flow definition
 * Extends core RuntimeFlowDefinition with React-specific useFlow hook
 */
// biome-ignore lint/suspicious/noExplicitAny: Generic constraint allows any context type
export type FlowDefinition<TConfig extends FlowConfig<any>> =
  CoreRuntimeFlowDefinition<TConfig, ExtractContext<TConfig>> & {
    /**
     * Custom hook for this flow with type-safe step navigation
     */
    useFlow: <TStep extends StepNames<TConfig>>(options: {
      step: TStep;
    }) => UseFlowReturn<
      ExtractContext<TConfig>,
      ValidNextSteps<TConfig, TStep>,
      StepNames<TConfig>
    >;
  };

/**
 * FlowConfig is an alias for core's FlowDefinition
 * Used for type constraints in defineFlow
 */
export type FlowConfig<TContext extends FlowContext = FlowContext> =
  CoreFlowDefinition<TContext>;

/**
 * Stripped-down step info exposed to components
 * Only contains navigation metadata, no component references
 */
export type StepInfo<TStepNames extends string = string> = {
  /** Possible next step(s) from this step */
  next?: TStepNames | readonly TStepNames[];
};

/**
 * Step element - a ReactElement (JSX) to display for this step
 *
 * Examples:
 * - <WelcomeStep /> - a component
 * - <ProfileStep name={userName} /> - a component with props
 * - <div>Hello world</div> - plain JSX
 *
 * To access flow state, use the useFlow() hook inside your component
 */
export type StepElement = ReactElement;

/**
 * Record mapping step names to React elements to display
 */
export type StepElements<TStepNames extends string = string> = Record<
  TStepNames,
  StepElement
>;

/**
 * Return type for the public useFlow() hook
 * This is what users get when they call useFlow() from context
 *
 * Extends UseFlowReducerReturn with React-specific flow metadata
 */
export type UseFlowReturn<
  TContext extends FlowContext,
  TValidNextSteps extends string = string,
  TStepNames extends string = string,
> = UseFlowReducerReturn<TContext, TValidNextSteps> & {
  isRestoring: boolean;
  /**
   * Manually trigger a save when saveMode="manual"
   * Does nothing if no persister is configured
   */
  save: () => Promise<void>;

  /**
   * All steps in the flow as a record of step IDs to step info
   * Each step only contains navigation metadata (next property)
   * Keys are narrowed to actual step names from the flow config
   */
  steps: Record<TStepNames, StepInfo<TStepNames>>;

  /**
   * Possible next steps from the current step
   * undefined if current step is terminal (no next steps)
   * Narrowed to ValidNextSteps when using typed hook from defineFlow
   */
  nextSteps: readonly TValidNextSteps[] | undefined;

  /**
   * Helper function to render the current step
   * Pass a record mapping step names to React elements
   *
   * @example
   * ```tsx
   * <Flow flow={myFlow}>
   *   {({ renderStep, context }) => renderStep({
   *     welcome: <WelcomeStep />,
   *     profile: <ProfileStep />,
   *     complete: <CompleteStep name={context.name} />
   *   })}
   * </Flow>
   * ```
   */
  renderStep: (elements: StepElements<TStepNames>) => ReactElement;
};

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

/**
 * Extract all possible step names from a flow type
 * Uses distributive conditional types to handle a union of flows automatically
 */
export type ExtractAllStepNames<TFlow> = TFlow extends FlowDefinition<
  infer TConfig
>
  ? TConfig extends { steps: infer TSteps }
    ? keyof TSteps
    : never
  : never;

/**
 * Extract context type from a flow type
 */
export type ExtractFlowContext<TFlow> = TFlow extends FlowDefinition<
  FlowConfig<infer TContext>
>
  ? TContext
  : FlowContext;

/**
 * Step elements mapping for Flow component
 * Maps step names to their React components
 */
export type FlowStepElements<TStepNames extends string> = Record<
  TStepNames,
  React.ReactElement
>;
