import type { FlowContext } from "@useflow/core";
import type { ReactElement } from "react";
import type { UseFlowReducerReturn } from "./use-flow-reducer";

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
