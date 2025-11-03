/**
 * Universal defineFlow function - framework-agnostic
 *
 * This function is used by all framework packages (React, Vue, Svelte, etc.)
 * to create enhanced flow definitions with runtime configuration
 */

import { validateFlowDefinition } from "./reducer";
import type {
  FlowRuntimeConfig,
  RuntimeFlowDefinition as RuntimeFlowDefinitionType,
} from "./runtime";
import type { FlowContext, FlowDefinition } from "./types";

/**
 * Runtime flow definition
 *
 * Provides a .with() method for adding typed runtime configuration
 * (resolvers, migration) to a flow definition.
 */
export class RuntimeFlowDefinition<
  TDefinition extends FlowDefinition = FlowDefinition,
  TContext extends FlowContext = FlowContext,
> implements RuntimeFlowDefinitionType<TDefinition, TContext>
{
  public readonly id: string;
  public readonly config: TDefinition;
  public readonly runtimeConfig?: RuntimeFlowDefinitionType<
    TDefinition,
    TContext
  >["runtimeConfig"];

  constructor(
    config: TDefinition,
    runtimeConfig?: RuntimeFlowDefinitionType<
      TDefinition,
      TContext
    >["runtimeConfig"],
  ) {
    // Validate the flow definition immediately
    validateFlowDefinition(config);

    // Set properties
    this.id = config.id;
    this.config = config;
    this.runtimeConfig = runtimeConfig;
  }

  /**
   * Add typed runtime configuration (resolvers, migration)
   *
   * Creates a new RuntimeFlowDefinition instance with the specified context type
   * and runtime configuration. The original instance remains unchanged (immutable).
   *
   * @param runtimeConfig - Function that receives type-safe step references and returns runtime behaviors
   * @returns New RuntimeFlowDefinition instance with typed context
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
    // Create step references object for type-safe step names
    const stepRefs: Record<string, string> = {};
    for (const stepName of Object.keys(this.config.steps)) {
      stepRefs[stepName] = stepName;
    }

    // Get runtime configuration if provided
    // biome-ignore lint/suspicious/noExplicitAny: Runtime type casting needed for step refs
    const runtimeConfigResult = runtimeConfig?.(stepRefs as any);

    // Return new class instance (immutable pattern)
    return new RuntimeFlowDefinition<TDefinition, NewContext>(
      this.config,
      runtimeConfigResult
        ? {
            migration: runtimeConfigResult.migration,
            resolvers: runtimeConfigResult.resolvers,
          }
        : undefined,
    );
  }
}

/**
 * Define a flow with declarative configuration
 *
 * Returns a RuntimeFlowDefinition instance that can be used directly
 * or chained with .with<TContext>() for typed runtime configuration
 *
 * @param config - Pure, JSON-serializable flow definition
 * @returns RuntimeFlowDefinition instance
 *
 * @example
 * ```ts
 * // Simple flow - use directly, no .with() needed
 * const simpleFlow = defineFlow({
 *   id: "simple",
 *   start: "welcome",
 *   steps: {
 *     welcome: { next: "complete" },
 *     complete: {}
 *   }
 * });
 *
 * // Flow with typed context and runtime config
 * type MyContext = { userType: "business" | "personal" };
 *
 * const complexFlow = defineFlow({
 *   id: "onboarding",
 *   version: "v2",
 *   start: "welcome",
 *   steps: {
 *     welcome: { next: "userType" },
 *     userType: { next: ["business", "personal"] },
 *     business: { next: "complete" },
 *     personal: { next: "complete" },
 *     complete: {}
 *   }
 * })
 * .with<MyContext>((steps) => ({
 *   migration: (state, fromVersion) => {
 *     if (fromVersion === "v1") {
 *       return {
 *         ...state,
 *         stepId: state.stepId === "profile"
 *           ? steps.userType  // ✅ Type-safe!
 *           : state.stepId
 *       };
 *     }
 *     return null;
 *   },
 *   resolvers: {
 *     userType: (ctx) =>  // ctx is MyContext
 *       ctx.userType === "business"
 *         ? steps.business      // ✅ Autocomplete works!
 *         : steps.personal
 *   }
 * }));
 * ```
 */
export function defineFlow<const TDefinition extends FlowDefinition>(
  config: TDefinition,
): RuntimeFlowDefinition<TDefinition, FlowContext> {
  return new RuntimeFlowDefinition(config);
}
