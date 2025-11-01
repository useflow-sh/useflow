/**
 * Universal defineFlow function - framework-agnostic
 *
 * This function is used by all framework packages (React, Vue, Svelte, etc.)
 * to create enhanced flow definitions with runtime configuration
 */

import { validateFlowDefinition } from "./reducer";
import type { FlowRuntimeConfig, RuntimeFlowDefinition } from "./runtime";
import type { FlowContext, FlowDefinition } from "./types";

/**
 * Define a flow with optional runtime configuration
 *
 * Creates an enhanced flow definition that separates serializable config
 * from runtime behaviors (migrate, resolve functions)
 *
 * @param config - Pure, JSON-serializable flow definition
 * @param runtimeConfig - Optional runtime configuration builder (receives type-safe step references)
 * @returns Enhanced flow definition with config and runtimeConfig behaviors
 *
 * @example
 * ```ts
 * // Simple flow - no runtime config
 * const simpleFlow = defineFlow({
 *   id: "simple",
 *   start: "welcome",
 *   steps: {
 *     welcome: { next: "complete" },
 *     complete: {}
 *   }
 * });
 *
 * // Complex flow - with runtime config
 * const complexFlow = defineFlow(
 *   {
 *     id: "onboarding",
 *     version: "v2",
 *     start: "welcome",
 *     steps: {
 *       welcome: { next: "userType" },
 *       userType: { next: ["business", "personal"] },
 *       business: { next: "complete" },
 *       personal: { next: "complete" },
 *       complete: {}
 *     }
 *   },
 *   (steps) => ({  // ← Type-safe step references
 *     migrate: (state, fromVersion) => {
 *       if (fromVersion === "v1") {
 *         return {
 *           ...state,
 *           stepId: state.stepId === "profile"
 *             ? steps.userType  // ✅ Type-safe!
 *             : state.stepId
 *         };
 *       }
 *       return null;
 *     },
 *     resolve: {
 *       userType: (ctx) =>
 *         ctx.type === "business"
 *           ? steps.business      // ✅ Autocomplete works!
 *           : steps.personal
 *     }
 *   })
 * );
 * ```
 */
export function defineFlow<
  TContext extends FlowContext,
  // biome-ignore lint/suspicious/noExplicitAny: Generic constraint allows any step definition shape
  const TDefinition extends FlowDefinition<TContext, any>,
>(
  config: TDefinition,
  runtimeConfig?: FlowRuntimeConfig<TDefinition, TContext>,
): RuntimeFlowDefinition<TDefinition, TContext> {
  // Validate the flow definition (catches config errors immediately)
  validateFlowDefinition(config);

  // Create step references object for type-safe step names
  const stepRefs: Record<string, string> = {};
  for (const stepName of Object.keys(config.steps)) {
    stepRefs[stepName] = stepName;
  }

  // Get runtime configuration if provided
  // biome-ignore lint/suspicious/noExplicitAny: Runtime type casting needed for step refs
  const runtimeConfigResult = runtimeConfig?.(stepRefs as any);

  return {
    id: config.id,
    config,
    runtimeConfig: runtimeConfigResult
      ? {
          migrate: runtimeConfigResult.migrate,
          resolvers: runtimeConfigResult.resolve,
        }
      : undefined,
  };
}
