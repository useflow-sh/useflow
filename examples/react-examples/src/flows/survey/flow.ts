import { defineFlow } from "@useflow/react";

/**
 * Survey Flow - Demonstrates Validation and Event Hooks
 *
 * This flow showcases useFlow's event system and validation patterns:
 *
 * Event Hooks:
 * - onNext: Triggered when moving forward (can be used for analytics, validation)
 * - onBack: Triggered when moving backward (can be used for tracking)
 * - onTransition: Triggered on any navigation (combines onNext and onBack)
 * - onComplete: Triggered when flow finishes
 *
 * Validation:
 * - Each question requires an answer before proceeding
 * - Progress tracking across multiple steps
 * - Score calculation based on answers
 *
 * Use Cases:
 * - Customer satisfaction surveys
 * - Quiz applications
 * - Multi-step forms with validation
 * - Analytics tracking for user behavior
 */

export type SurveyFlowContext = {
  // Question responses (1-5 rating)
  q1_satisfaction?: number;
  q2_recommend?: number;
  q3_features?: number;
  q4_support?: number;

  // Metadata
  score?: number;

  // Tracking
  questionsAnswered?: number;

  // Note: startedAt, completedAt, and totalTime are automatically tracked
  // by the flow state and available via the useFlow() hook
};

export const surveyFlow = defineFlow({
  id: "survey-flow",
  start: "intro",
  steps: {
    intro: {
      next: "question1",
    },
    question1: {
      next: "question2",
    },
    question2: {
      next: "question3",
    },
    question3: {
      next: "question4",
    },
    question4: {
      next: "results",
    },
    results: {},
  },
});
