import { getFlowConfigFromDatabase } from "./database";

/**
 * API Layer for Flow Configuration
 *
 * This simulates an API endpoint that fetches flow configurations from a database.
 * Returns a FlowConfig object (not a FlowDefinition - use defineFlow to convert it).
 *
 * In a real application, this would be an actual API route that:
 * 1. Receives requests from the client
 * 2. Queries the database for the appropriate flow configuration
 * 3. Returns the configuration to the client
 *
 * Example real-world implementations:
 * - REST API: GET /api/flows/:flowId/variants/:variantId
 * - GraphQL: query { flowConfig(flowId: "onboarding-flow", variantId: "standard") { ... } }
 * - tRPC: flowRouter.getConfig({ flowId: "onboarding-flow", variantId: "standard" })
 */

/**
 * Fetch flow config from API
 *
 * This function simulates an API call that fetches a specific flow config
 * by flow ID and variant ID. This architecture supports:
 * - Multiple flow types (onboarding, checkout, etc.)
 * - A/B testing with different variants per flow
 * - Dynamic flow switching without redeployment
 *
 * In production, this would be replaced with an actual API call:
 * ```ts
 * const response = await fetch(`/api/flows/${flowId}/variants/${variantId}`);
 * return response.json();
 * ```
 */
export async function fetchFlowConfig(
  flowId: string,
  variantId: string,
  // Simulate the untyped return type of the API call
): Promise<unknown> {
  // Simulate network latency
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Fetch from "database"
  const config = getFlowConfigFromDatabase(flowId, variantId);

  if (!config) {
    throw new Error(
      `Flow configuration not found: ${flowId} (variant: ${variantId})`,
    );
  }

  // In a real app, you might also:
  // - Log analytics event
  // - Check user permissions
  // - Apply personalization based on user segment
  // - Track which variant was served for A/B testing
  // - Apply feature flags
  // - Add custom business logic per variant

  return config;
}
