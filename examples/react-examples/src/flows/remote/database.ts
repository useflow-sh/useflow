/**
 * Simulated Database Storage
 *
 * In a real application, these flow configurations would be stored in a database
 * (e.g., PostgreSQL, MongoDB, Firestore) and managed through an admin interface.
 *
 * This file simulates what that database would contain - different flow configurations
 * that can be retrieved based on various criteria (A/B test groups, user segments, etc.)
 */

// Standard flow with verification
export const standardFlowConfig = {
  id: "onboarding-flow",
  variantId: "standard",
  start: "welcome",
  steps: {
    welcome: { next: "account" },
    account: { next: "verification" },
    verification: { next: "profile" },
    profile: { next: "preferences" },
    preferences: { next: "complete" },
    complete: {},
  },
};

// Express flow for A/B testing (optimized for conversion)
export const expressFlowConfig = {
  id: "onboarding-flow",
  variantId: "express",
  start: "welcome",
  steps: {
    welcome: { next: "account" },
    account: { next: "profile" }, // Skip verification
    profile: { next: "complete" }, // Skip preferences
    complete: {},
  },
};

// Extended flow with additional steps
export const extendedFlowConfig = {
  id: "onboarding-flow",
  variantId: "extended",
  start: "welcome",
  steps: {
    welcome: { next: "account" },
    account: { next: "verification" },
    verification: { next: "profile" },
    profile: { next: "survey" },
    survey: { next: "newsletter" },
    newsletter: { next: "preferences" },
    preferences: { next: "complete" },
    complete: {},
  },
};

// Simulated database: Map of flowId -> variantId -> FlowConfig
const database = {
  "onboarding-flow": {
    standard: standardFlowConfig,
    express: expressFlowConfig,
    extended: extendedFlowConfig,
  },
};

/**
 * Simulated database query function
 *
 * Fetches a flow config by flow ID and variant ID.
 * Returns a FlowConfig (not a FlowDefinition - use defineFlow to convert it).
 *
 * This allows you to:
 * - Store multiple flow templates (different flow IDs)
 * - Each template can have multiple variants (A/B testing, feature flags, etc.)
 *
 * In a real app, this would be something like:
 * - Prisma: prisma.flowConfig.findUnique({ where: { flowId_variantId: { flowId, variantId } } })
 * - MongoDB: db.collection('flowConfigs').findOne({ flowId, variantId })
 * - Firestore: firestore.collection('flowConfigs').doc(`${flowId}_${variantId}`).get()
 */
export function getFlowConfigFromDatabase(flowId: string, variantId: string) {
  return (
    database[flowId as keyof typeof database]?.[
      variantId as keyof (typeof database)[keyof typeof database]
    ] || null
  );
}

/**
 * Get all available variants for a specific flow
 * Simulates: SELECT * FROM flow_configs WHERE flow_id = ?
 */
export function getAllFlowVariants(flowId: string) {
  const variants = database[flowId as keyof typeof database];
  return variants ? Object.values(variants) : [];
}
