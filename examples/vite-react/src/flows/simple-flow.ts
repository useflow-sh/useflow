import { defineFlow, type FlowConfig } from "@useflow/react";

/**
 * Simple linear onboarding flow
 * Demonstrates basic step-to-step navigation
 */

export type SimpleFlowContext = {
  name: string;
  theme?: "light" | "dark";
  notifications: boolean;
  startedAt?: number;
};

export const simpleFlow = defineFlow({
  id: "simple-flow",
  start: "welcome",
  steps: {
    welcome: {
      next: "profile",
    },
    profile: {
      next: "preferences",
    },
    preferences: {
      next: "complete",
    },
    complete: {
      // no next step = flow is complete
    },
  },
} as const satisfies FlowConfig<SimpleFlowContext>);
