import type { FlowContext } from "@useflow/core";
import type { ComponentType } from "react";
import type { UseFlowReducerReturn } from "./use-flow-reducer";

/**
 * Runtime step definition with component attached
 * @internal
 */
type RuntimeStepDefinition<TContext extends FlowContext = FlowContext> = {
  next?: string | string[] | ((context: TContext) => string | undefined);
  // biome-ignore lint/suspicious/noExplicitAny: Components can accept arbitrary props defined by users
  component: ComponentType<any>;
};

/**
 * Runtime flow definition with components attached
 * @internal
 */
export type RuntimeFlowDefinition<TContext extends FlowContext = FlowContext> =
  {
    start: string;
    steps: Record<string, RuntimeStepDefinition<TContext>>;
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
> = UseFlowReducerReturn<TContext, TValidNextSteps> & {
  /** @internal Runtime flow definition with components */
  __flow: RuntimeFlowDefinition<TContext>;
  // biome-ignore lint/suspicious/noExplicitAny: Components can accept arbitrary props defined by users
  component: ComponentType<any> | undefined;
  isRestoring: boolean;
  /**
   * Manually trigger a save when saveMode="manual"
   * Does nothing if no persister is configured
   */
  save: () => Promise<void>;
};
