import { defineFlow } from "@useflow/react";

/**
 * Dynamic Flows - Demonstrates Flow Definition Switching
 *
 * This example showcases how the SAME step components can be used with
 * DIFFERENT flow definitions, allowing you to:
 *
 * 1. **Switch flow logic at runtime** based on conditions (A/B testing, feature flags, etc.)
 * 2. **Reuse step components** across multiple flow configurations
 * 3. **Maintain consistent UI** while varying the navigation logic
 *
 * Key Concept:
 * - Components use the generic `useFlow()` hook (not flow.useFlow())
 * - This makes them flow-agnostic and reusable
 * - Different flows can arrange the same components in different orders
 *
 * Use Cases:
 * - A/B testing different onboarding experiences
 * - Feature flags that enable/disable verification steps
 * - Role-based flows (admin vs user paths)
 * - Progressive disclosure (beginner vs expert modes)
 * - Server-driven flows (fetch entire flow definition from API)
 *   - Update flows without redeploying
 *   - Customize flows per user/tenant
 *   - Test new flows with specific users
 *
 * ⚠️ IMPORTANT: Dynamic flow switching
 *
 * This example shows how to switch between different flow definitions at runtime.
 * TypeScript infers the exact step types for each flow automatically.
 *
 *   // Example 1: Switch based on condition
 *   const selectedFlow = useExpress ? expressFlow : standardFlow;
 *   <Flow flow={selectedFlow} />  // ✅ Works!
 *
 *   // Example 2: Fetch flow definition from API
 *   const flowConfig = await fetch('/api/flow').then(r => r.json());
 *   const flow = defineFlow(flowConfig);
 *   <Flow flow={flow} />  // ✅ Works!
 *
 * Trade-off when mixing flows with different steps:
 * ✅ You CAN switch flows dynamically
 * ❌ TypeScript sees the union type, so type-safe navigation is limited
 *
 * Components in dynamic flows use the generic useFlow() hook (not flow.useFlow())
 * to be reusable across both flow configurations.
 */

export type OnboardingContext = {
  // Account info
  email: string;
  username: string;
  // Profile info
  name: string;
  bio?: string;
  // Preferences
  notifications: boolean;
  newsletter?: boolean;
  // Verification
  verificationCode?: string;
};

/**
 * Standard Flow: Full onboarding with verification
 * Path: welcome → account → verification → profile → preferences → complete
 *
 * This is the comprehensive flow that includes all steps including
 * email verification before allowing users to proceed.
 */
export const standardFlow = defineFlow({
  id: "onboarding-flow",
  variantId: "standard",
  start: "welcome",
  steps: {
    welcome: {
      next: "account",
    },
    account: {
      // After account creation, verify email
      next: "verification",
    },
    verification: {
      // After verification, collect profile info
      next: "profile",
    },
    profile: {
      next: "preferences",
    },
    preferences: {
      next: "complete",
    },
    complete: {
      // Terminal step
    },
  },
});

/**
 * Express Flow: Quick onboarding without verification
 * Path: welcome → account → profile → complete
 *
 * This is a streamlined flow that skips verification and preferences
 * to get users started faster. Useful for:
 * - A/B testing conversion rates
 * - Social login flows (email already verified)
 * - Low-friction onboarding experiments
 */
export const expressFlow = defineFlow({
  id: "onboarding-flow",
  variantId: "express",
  start: "welcome",
  steps: {
    welcome: {
      next: "account",
    },
    account: {
      // Skip verification, go straight to profile
      next: "profile",
    },
    profile: {
      // Skip preferences, go straight to complete
      next: "complete",
    },
    complete: {
      // Terminal step
    },
  },
});
