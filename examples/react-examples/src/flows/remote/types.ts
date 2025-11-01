/**
 * Shared context type for remote onboarding flow
 * Used across all variants (standard, express, extended)
 */
export type RemoteOnboardingContext = {
  // Account step
  email?: string;
  name?: string;
  password?: string;

  // User type (for branching logic)
  userType?: "business" | "personal";

  // Verification step
  verificationCode?: string;
  verified?: boolean;

  // Profile step
  bio?: string;
  avatar?: string;
  location?: string;

  // Survey step (extended flow)
  surveyResponses?: Record<string, string>;

  // Newsletter step (extended flow)
  subscribeToNewsletter?: boolean;

  // Preferences step
  preferences?: {
    theme?: "light" | "dark" | "system";
    notifications?: boolean;
    language?: string;
  };
};
