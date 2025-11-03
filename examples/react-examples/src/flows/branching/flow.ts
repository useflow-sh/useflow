import { defineFlow } from "@useflow/react";

/**
 * Branching Flow - Demonstrates Conditional Navigation
 *
 * This flow showcases two types of branching:
 *
 * 1. **Context-Driven navigation** (userType step):
 *    - Flow automatically decides next step based on context
 *    - Business users see businessDetails step, personal users skip it
 *    - Configured with: next: ["businessDetails", "setupPreference"] + resolve function
 *    - The resolve function is defined in runtimeConfig and returns the appropriate step
 *
 * 2. **Component-Driven navigation** (setupPreference step):
 *    - Component explicitly chooses which step to navigate to
 *    - Advanced setup calls next("preferences"), quick setup calls next("complete")
 *    - Configured with: next: ["preferences", "complete"]
 *    - No resolve function - component has full control via next(target)
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
    userType: {
      // Context-driven: resolve function decides between businessDetails or setupPreference
      next: ["businessDetails", "setupPreference"],
    },
    businessDetails: {
      next: "setupPreference",
    },
    setupPreference: {
      // Component-driven: component calls next("preferences") or next("complete")
      next: ["preferences", "complete"],
    },
    preferences: {
      next: "complete",
    },
    complete: {},
  },
}).with<BranchingFlowContext>((steps) => ({
  resolvers: {
    userType: (ctx) =>
      ctx.userType === "business"
        ? steps.businessDetails
        : steps.setupPreference,
  },
}));
