import { validateFlowDefinition } from "@useflow/core";
import { useFlow } from "./flow";
import type {
  ExtractContext,
  FlowConfig,
  StepNames,
  ValidNextSteps,
} from "./type-helpers";
import type { UseFlowReturn } from "./types";

/**
 * Enhanced flow object returned by defineFlow
 * Contains a type-safe useFlow hook, the original config, and flow ID
 */
// biome-ignore lint/suspicious/noExplicitAny: Generic constraint allows any context type
export type FlowDefinition<TConfig extends FlowConfig<any>> = {
  id: string;

  /**
   * The flow configuration (raw config object)
   */
  config: TConfig;

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
 * Define a flow configuration with type-safe navigation
 * Returns an object with a type-safe useFlow hook and config
 *
 * Use with 'as const satisfies FlowConfig<YourContext>' for full type safety!
 *
 * Components are defined at the FlowProvider level for better co-location.
 *
 * @example
 * ```ts
 * type MyContext = { userType: "business" | "personal" };
 *
 * export const myFlow = defineFlow({
 *   id: 'my-flow',
 *   start: 'welcome',
 *   steps: {
 *     welcome: {
 *       next: ['business', 'personal'],
 *       resolve: (ctx) => ctx.userType === 'business' ? 'business' : 'personal'
 *     },
 *     business: { next: 'complete' },
 *     personal: { next: 'complete' },
 *     complete: {}
 *   }
 * } as const satisfies FlowConfig<MyContext>);
 *
 * // In component - use the hook:
 * function WelcomeStep() {
 *   const { next, setContext } = myFlow.useFlow({ step: 'welcome' });
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
 *
 * // Define components at Flow level:
 * <Flow
 *   flow={myFlow}
 *   components={{
 *     welcome: WelcomeStep,
 *     business: BusinessStep,
 *     personal: PersonalStep,
 *     complete: CompleteStep
 *   }}
 *   initialContext={{ userType: 'business' }}
 * />
 * ```
 */
// biome-ignore lint/suspicious/noExplicitAny: Generic constraint allows any context type
export function defineFlow<TConfig extends FlowConfig<any>>(
  config: TConfig,
): FlowDefinition<TConfig> {
  type TContext = ExtractContext<TConfig>;

  // Always validate flow definition (catches config errors immediately)
  // This is a one-time check at initialization, not in hot path
  validateFlowDefinition(config);

  // Create the hook
  const useFlowHook = <TStep extends StepNames<TConfig>>(options: {
    step: TStep;
  }): UseFlowReturn<
    TContext,
    ValidNextSteps<TConfig, TStep>,
    StepNames<TConfig>
  > => {
    // Safe cast: The Flow component guarantees the runtime shape matches the types
    // - steps contains all StepNames<TConfig> as keys with proper StepInfo
    // - nextSteps is narrowed to ValidNextSteps based on current step
    return useFlow<TContext>(options) as unknown as UseFlowReturn<
      TContext,
      ValidNextSteps<TConfig, TStep>,
      StepNames<TConfig>
    >;
  };

  return {
    id: config.id,
    config,
    useFlow: useFlowHook,
  };
}
