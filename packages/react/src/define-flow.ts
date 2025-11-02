import {
  defineFlow as coreDefineFlow,
  type FlowContext,
  type FlowRuntimeConfig,
} from "@useflow/core";
import { useFlow } from "./flow";
import type {
  ExtractContext,
  FlowConfig,
  FlowDefinition,
  StepNames,
  UseFlowReturn,
  ValidNextSteps,
} from "./types";

// Re-export FlowDefinition for backwards compatibility
export type { FlowDefinition };

/**
 * Define a React flow with type-safe navigation and optional runtime config
 *
 * Wraps the core defineFlow with React-specific useFlow hook for type-safe step navigation.
 *
 * **Note:** No `as const` needed! The `const` type parameter automatically infers literal types.
 * Optionally specify context type via generic parameter `defineFlow<MyContext>(...)`.
 *
 * @param config - Flow configuration (serializable)
 * @param runtimeConfig - Optional runtime configuration builder (receives type-safe step references)
 *
 * @example
 * ```ts
 * // Simple flow - no "as const" needed!
 * export const simpleFlow = defineFlow({
 *   id: 'simple-flow',
 *   start: 'welcome',
 *   steps: {
 *     welcome: { next: 'complete' },
 *     complete: {}
 *   }
 * });
 *
 * // With context type and runtime config
 * type MyContext = { userType: "business" | "personal" };
 *
 * export const myFlow = defineFlow<MyContext>({
 *   id: 'my-flow',
 *   start: 'welcome',
 *   steps: {
 *     welcome: { next: ['business', 'personal'] },
 *     business: { next: 'complete' },
 *     personal: { next: 'complete' },
 *     complete: {}
 *   }
 * }, (steps) => ({
 *   resolve: {
 *     welcome: (ctx) => ctx.userType === 'business'
 *       ? steps.business
 *       : steps.personal
 *   }
 * }));
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
 * ```
 */
// Support two calling patterns:
// 1. defineFlow({ config }) - context type defaults to FlowContext
// 2. defineFlow<MyContext>({ config }) - context type explicitly provided for resolvers
export function defineFlow<
  TContext extends FlowContext = FlowContext,
  const TConfig extends FlowConfig<TContext> = FlowConfig<TContext>,
>(
  config: TConfig,
  runtimeConfig?: FlowRuntimeConfig<TConfig, TContext>,
): FlowDefinition<TConfig> {
  // Call core defineFlow to get enhanced definition
  const coreDefinition = coreDefineFlow<TContext, TConfig>(
    config,
    runtimeConfig,
  );

  // Create React-specific hook
  const useFlowHook = <TStep extends StepNames<TConfig>>(options: {
    step: TStep;
  }): UseFlowReturn<
    ExtractContext<TConfig>,
    ValidNextSteps<TConfig, TStep>,
    StepNames<TConfig>
  > => {
    // Safe cast: The Flow component guarantees the runtime shape matches the types
    // - steps contains all StepNames<TConfig> as keys with proper StepInfo
    // - nextSteps is narrowed to ValidNextSteps based on current step
    return useFlow<ExtractContext<TConfig>>(
      options,
    ) as unknown as UseFlowReturn<
      ExtractContext<TConfig>,
      ValidNextSteps<TConfig, TStep>,
      StepNames<TConfig>
    >;
  };

  return {
    ...coreDefinition,
    useFlow: useFlowHook,
  } as FlowDefinition<TConfig>;
}
