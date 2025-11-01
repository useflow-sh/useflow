import { defineFlow } from "@useflow/react";

/**
 * Simple Linear Flow - Basic Step-by-Step Navigation
 *
 * This flow demonstrates the fundamentals of useFlow:
 * - Linear step progression (welcome → profile → preferences → complete)
 * - Form validation (can't proceed without required fields)
 * - Context updates using both objects and updater functions
 * - Optional steps (skip preferences)
 * - State persistence with auto-save
 *
 * Perfect for getting started with useFlow!
 */

export type SimpleFlowContext = {
  name: string;
  theme?: "light" | "dark";
  notifications: boolean;
  startedAt?: number;
  skippedPreferences?: boolean; // Track if user skipped preferences
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
      // Allow skipping to complete
      next: "complete",
    },
    complete: {
      // Terminal step - flow is complete
    },
  },
});
