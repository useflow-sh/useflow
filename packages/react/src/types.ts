import type { FlowContext } from "@useflow/core";
import type { ComponentType } from "react";
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
  // biome-ignore lint/suspicious/noExplicitAny: Components can accept arbitrary props defined by users
  component: ComponentType<any> | undefined;
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
};
