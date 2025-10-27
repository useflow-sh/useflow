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
  }) => UseFlowReturn<ExtractContext<TConfig>, ValidNextSteps<TConfig, TStep>>;
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
 *   start: 'welcome',
 *   steps: {
 *     welcome: {
 *       next: (ctx) => ctx.userType === 'business' ? 'business' : 'personal'
 *     }
 *   }
 * } as const satisfies FlowConfig<MyContext>);
 *
 * // In component - use the hook:
 * function WelcomeStep() {
 *   const { next, context } = myFlow.useFlow({ step: 'welcome' });
 *   next('business'); // Type-safe!
 * }
 *
 * // Define components at FlowProvider:
 * <FlowProvider
 *   flow={myFlow}
 *   components={{
 *     welcome: WelcomeStep,
 *     business: BusinessStep,
 *     personal: PersonalStep
 *   }}
 *   initialContext={{ userType: '' }}
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
  }): UseFlowReturn<TContext, ValidNextSteps<TConfig, TStep>> => {
    return useFlow<TContext>(options) as UseFlowReturn<
      TContext,
      ValidNextSteps<TConfig, TStep>
    >;
  };

  return {
    id: config.id,
    config,
    useFlow: useFlowHook,
  };
}
