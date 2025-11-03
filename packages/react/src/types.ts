import type { FlowContext } from "@useflow/core";
import type { ReactElement } from "react";
import type { RuntimeFlowDefinition } from "./define-flow";
import type { FlowDefinition, UseFlowReducerReturn } from "./use-flow-reducer";

export type { FlowDefinition };

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
export type StepNames<TDefinition> = TDefinition extends { steps: infer S }
  ? keyof S
  : never;

/**
 * Extract valid next step destinations for a specific step
 * - For arrays: extracts union of array element types (e.g., ["stepA", "stepB"] → "stepA" | "stepB")
 * - For strings: returns the string literal type (e.g., "stepA" → "stepA")
 * - For undefined: returns never (terminal step with no next)
 */
export type ValidNextSteps<
  TDefinition,
  TStep extends StepNames<TDefinition>,
> = TDefinition extends { steps: infer S }
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
export type ExtractAllStepNames<TFlow> = TFlow extends RuntimeFlowDefinition<
  infer TDefinition,
  // biome-ignore lint/suspicious/noExplicitAny: Required for TypeScript conditional type inference
  any
>
  ? TDefinition extends { steps: infer TSteps }
    ? keyof TSteps
    : never
  : never;

/**
 * Extract context type from a flow type
 */
export type ExtractFlowContext<TFlow> = TFlow extends RuntimeFlowDefinition<
  // biome-ignore lint/suspicious/noExplicitAny: Required for TypeScript conditional type inference
  any,
  infer TContext
>
  ? TContext
  : FlowContext;
