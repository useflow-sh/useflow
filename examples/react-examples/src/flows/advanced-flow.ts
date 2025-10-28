import { defineFlow } from "@useflow/react";

/**
 * Advanced onboarding flow with conditional branching
 * Demonstrates:
 * - User type selection (business vs personal) - context-driven branching
 * - Setup preference selection - component-driven branching
 * - Different paths through the flow
 * - Business-specific steps only shown to business users
 */

export type AdvancedFlowContext = {
  name: string;
  userType?: "business" | "personal";
  theme?: "light" | "dark";
  notifications: boolean;
  startedAt?: number;
  // Business-specific fields
  businessIndustry?: string;
  companyName?: string;
  // Setup preference navigation choice
  setupPreference?: "advanced" | "quick";
};

export const advancedFlow = defineFlow({
  id: "advanced-flow",
  start: "welcome",
  steps: {
    welcome: {
      next: "profile",
    },
    profile: {
      next: "userType",
    },
    userType: {
      // Context-driven: flow decides next step based on context
      next: (ctx: AdvancedFlowContext) =>
        ctx.userType === "business" ? "businessDetails" : "setupPreference",
    },
    businessDetails: {
      next: "setupPreference",
    },
    setupPreference: {
      // Component-driven: component explicitly chooses which step to navigate to
      next: ["preferences", "complete"],
    },
    preferences: {
      next: "complete",
    },
    complete: {
      // no next step = flow is complete
    },
  },
} as const);
