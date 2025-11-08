import {
  RuntimeFlowDefinition as CoreRuntimeFlowDefinition,
  type FlowContext,
  type FlowRuntimeConfig,
} from "@useflow/core";
import { useFlowState } from "./flow";
import type {
  FlowDefinition,
  StepNames,
  UseFlowReturn,
  ValidNextSteps,
} from "./types";

/**
 * React-specific runtime flow definition
 *
 * Extends the core RuntimeFlowDefinition class and adds the useFlowState hook
 * for type-safe step navigation within React components.
 */
export class RuntimeFlowDefinition<
  TDefinition extends FlowDefinition = FlowDefinition,
  TContext extends FlowContext = FlowContext,
> extends CoreRuntimeFlowDefinition<TDefinition, TContext> {
  // React-specific useFlowState hook
  public readonly useFlowState: <
    TStep extends StepNames<TDefinition>,
  >(options: {
    step: TStep;
  }) => UseFlowReturn<
    TContext,
    ValidNextSteps<TDefinition, TStep>,
    StepNames<TDefinition>
  >;

  constructor(
    config: TDefinition,
    runtimeConfig?: CoreRuntimeFlowDefinition<
      TDefinition,
      TContext
    >["runtimeConfig"],
  ) {
    super(config, runtimeConfig);

    // Create the useFlowState hook for this specific context type
    this.useFlowState = <TStep extends StepNames<TDefinition>>(options: {
      step: TStep;
    }): UseFlowReturn<
      TContext,
      ValidNextSteps<TDefinition, TStep>,
      StepNames<TDefinition>
    > => {
      return useFlowState<TContext>(options) as unknown as UseFlowReturn<
        TContext,
        ValidNextSteps<TDefinition, TStep>,
        StepNames<TDefinition>
      >;
    };
  }

  /**
   * Add typed runtime configuration with React useFlowState hook
   *
   * Creates a new RuntimeFlowDefinition instance with the specified context type,
   * runtime configuration, and context-specific useFlowState hook.
   *
   * @param runtimeConfig - Function that receives type-safe step references
   * @returns New RuntimeFlowDefinition instance with React useFlowState hook and typed context
   *
   * @example
   * ```ts
   * type MyContext = { userType: "business" | "personal" };
   *
   * const flow = defineFlow({
   *   id: "my-flow",
   *   steps: {
   *     start: { next: ["business", "personal"] },
   *     business: { next: "complete" },
   *     personal: { next: "complete" },
   *     complete: {}
   *   }
   * })
   * .with<MyContext>((steps) => ({
   *   resolvers: {
   *     start: (ctx) =>
   *       ctx.userType === "business"
   *         ? steps.business
   *         : steps.personal
   *   }
   * }));
   * ```
   */
  with<NewContext extends FlowContext = FlowContext>(
    runtimeConfig?: FlowRuntimeConfig<TDefinition, NewContext>,
  ): RuntimeFlowDefinition<TDefinition, NewContext> {
    // Get the core result (a new core RuntimeFlowDefinition instance)
    const coreInstance = super.with<NewContext>(runtimeConfig);

    // Return new React RuntimeFlowDefinition instance with useFlowState hook
    return new RuntimeFlowDefinition<TDefinition, NewContext>(
      coreInstance.config,
      coreInstance.runtimeConfig,
    );
  }
}

/**
 * Define a React flow with type-safe navigation
 *
 * Returns a RuntimeFlowDefinition instance that can be used directly
 * or chained with .with<TContext>() for typed runtime configuration
 *
 * @param config - Flow configuration (serializable)
 * @returns RuntimeFlowDefinition instance with useFlowState hook
 *
 * @example
 * ```ts
 * // Simple flow - use directly
 * const simpleFlow = defineFlow({
 *   id: 'simple-flow',
 *   start: 'welcome',
 *   steps: {
 *     welcome: { next: 'complete' },
 *     complete: {}
 *   }
 * });
 *
 * // Flow with typed context and runtime config
 * type MyContext = { userType: "business" | "personal" };
 *
 * const myFlow = defineFlow({
 *   id: 'my-flow',
 *   start: 'welcome',
 *   steps: {
 *     welcome: { next: ['business', 'personal'] },
 *     business: { next: 'complete' },
 *     personal: { next: 'complete' },
 *     complete: {}
 *   }
 * })
 * .with<MyContext>((steps) => ({
 *   resolvers: {
 *     welcome: (ctx) => ctx.userType === 'business'
 *       ? steps.business
 *       : steps.personal
 *   }
 * }));
 *
 * // In component - use the hook:
 * function WelcomeStep() {
 *   const { next, setContext } = myFlow.useFlowState({ step: 'welcome' });
 *
 *   return (
 *     <button onClick={() => {
 *       setContext({ userType: 'business' });
 *       next(); // Flow decides based on context
 *     }}>
 *       Choose Business
 *     </button>
 *   );
 * }
 * ```
 */
export function defineFlow<const TDefinition extends FlowDefinition>(
  config: TDefinition,
): RuntimeFlowDefinition<TDefinition, FlowContext> {
  return new RuntimeFlowDefinition(config);
}
