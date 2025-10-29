import { defineFlow, step } from "@useflow/react";

/**
 * Branching Flow - Demonstrates Conditional Navigation
 *
 * This flow showcases useFlow's branching capabilities:
 *
 * 1. **Context-Driven Branching** (userType step):
 *    - Flow definition decides next step based on context
 *    - Business users see extra step, personal users skip it
 *    - Uses: next: ['businessDetails', 'setupPreference'] + resolve: (ctx) => ...
 *
 * 2. **Component-Driven Branching** (setupPreference step):
 *    - Component explicitly chooses which step to navigate to
 *    - Advanced setup goes to preferences, quick setup skips to complete
 *    - Uses: next: ['preferences', 'complete'] + component calls next('preferences') or next('complete')
 *
 * Flow Paths:
 * - Business + Advanced: welcome → profile → userType → businessDetails → setupPreference → preferences → complete
 * - Business + Quick:    welcome → profile → userType → businessDetails → setupPreference → complete
 * - Personal + Advanced: welcome → profile → userType → setupPreference → preferences → complete
 * - Personal + Quick:    welcome → profile → userType → setupPreference → complete
 */

export type BranchingFlowContext = {
  name: string;
  userType?: "business" | "personal";
  theme?: "light" | "dark";
  notifications: boolean;
  startedAt?: number;
  // Business-specific fields (only filled for business users)
  businessIndustry?: string;
  companyName?: string;
  // Setup preference navigation choice
  setupPreference?: "advanced" | "quick";
};

export const branchingFlow = defineFlow({
  id: "branching-flow",
  start: "welcome",
  steps: {
    welcome: {
      next: "profile",
    },
    profile: {
      next: "userType",
    },
    // ✨ CONTEXT-DRIVEN BRANCHING WITH TYPE SAFETY
    // Using step() helper provides compile-time type safety
    // TypeScript will catch errors if resolve returns invalid step names
    userType: step({
      next: ["businessDetails", "setupPreference"],
      resolve: (ctx: BranchingFlowContext) =>
        ctx.userType === "business" ? "businessDetails" : "setupPreference",
    }),
    businessDetails: {
      // Only business users reach this step
      next: "setupPreference",
    },
    setupPreference: {
      // ✨ COMPONENT-DRIVEN BRANCHING
      // Component explicitly calls next('preferences') or next('complete')
      // This gives components full control over navigation logic
      // This also makes navigation type-safe when using branchingFlow.useFlow()
      // See type-safe navigation example in SetupPreferenceStep.tsx
      next: ["preferences", "complete"],
    },
    preferences: {
      // Only users who chose "advanced" setup reach this step
      next: "complete",
    },
    complete: {
      // Terminal step - flow is complete
    },
  },
} as const);
