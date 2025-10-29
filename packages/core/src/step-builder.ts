/**
 * Type-safe step builder for steps with resolve functions
 *
 * This provides compile-time type safety for resolve functions,
 * ensuring they can only return values from the next array.
 *
 * Supports additional properties like label, metadata, etc.
 *
 * @example
 * ```ts
 * import { step } from '@useflow/core';
 *
 * // Basic usage
 * const userTypeStep = step({
 *   next: ['businessDetails', 'preferences'],
 *   resolve: (ctx: MyContext) => ctx.userType === 'business' ? 'businessDetails' : 'preferences'
 * });
 *
 * // With additional properties
 * const stepWithLabel = step({
 *   next: ['stepA', 'stepB'],
 *   resolve: (ctx) => ctx.choice === 'A' ? 'stepA' : 'stepB',
 *   label: 'Choose your path',
 *   metadata: { analytics: 'important-decision' }
 * });
 *
 * // Type error - 'invalidStep' is not in the next array:
 * const badStep = step({
 *   next: ['businessDetails', 'preferences'],
 *   resolve: (ctx: MyContext) => 'invalidStep'  // ❌ Type error!
 * });
 * ```
 */

/**
 * Type-safe step definition builder
 *
 * Enforces that resolve functions can only return values from the next array.
 * Supports any additional properties you want to add.
 *
 * @param config - Step configuration with next array and resolve function
 * @returns The same config object (identity function for type safety)
 */
export function step<
  const TNext extends readonly string[],
  // biome-ignore lint/suspicious/noExplicitAny: allow any context
  TResolve extends (context: any) => TNext[number] | undefined,
>(config: {
  next: TNext;
  resolve: TResolve;
  [key: string]: unknown;
}): {
  next: TNext;
  resolve: TResolve;
  [key: string]: unknown;
} {
  return config;
}
