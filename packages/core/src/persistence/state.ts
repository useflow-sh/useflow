import type { FlowContext, FlowDefinition, PersistedFlowState } from "../types";

/**
 * Validation result
 */
export type ValidationResult = {
  valid: boolean;
  errors?: string[];
};

/**
 * Validate that persisted state is compatible with flow definition
 * Checks that all step references exist and state is internally consistent
 */
export function validatePersistedState<TContext extends FlowContext>(
  persisted: PersistedFlowState<TContext>,
  definition: FlowDefinition<TContext>,
): ValidationResult {
  const errors: string[] = [];
  const stepNames = new Set(Object.keys(definition.steps));

  // Validate stepId exists
  if (!stepNames.has(persisted.stepId)) {
    errors.push(
      `Current step "${persisted.stepId}" not found in flow definition. ` +
        `Available steps: ${Array.from(stepNames).join(", ")}`,
    );
  }

  // Validate history is not empty
  if (persisted.history.length === 0) {
    errors.push("History cannot be empty");
  } else {
    // Validate start step exists in history
    if (persisted.history[0] !== definition.start) {
      errors.push(
        `History must start with "${definition.start}", got "${persisted.history[0]}"`,
      );
    }

    // Validate all history steps exist
    for (const stepId of persisted.history) {
      if (!stepNames.has(stepId)) {
        errors.push(`History contains non-existent step "${stepId}"`);
      }
    }

    // Validate history consistency
    const lastInHistory = persisted.history[persisted.history.length - 1];
    if (lastInHistory !== persisted.stepId) {
      errors.push(
        `Current stepId "${persisted.stepId}" must match last item in history "${lastInHistory}"`,
      );
    }
  }

  // Validate status is consistent with step definition
  const currentStep = definition.steps[persisted.stepId];
  if (currentStep) {
    const expectedStatus = currentStep.next ? "active" : "complete";
    if (persisted.status !== expectedStatus) {
      errors.push(
        `Status "${persisted.status}" doesn't match expected "${expectedStatus}" for step "${persisted.stepId}"`,
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Serialize flow state to JSON string
 * Safe serialization with error handling
 */
export function serializeFlowState<TContext extends FlowContext>(
  state: PersistedFlowState<TContext>,
): string {
  return JSON.stringify(state);
}

/**
 * Deserialize JSON string to flow state
 * Returns null if JSON is invalid or malformed
 */
export function deserializeFlowState<TContext extends FlowContext>(
  json: string,
): PersistedFlowState<TContext> | null {
  try {
    const parsed = JSON.parse(json);

    // Basic structure validation
    if (
      typeof parsed !== "object" ||
      typeof parsed.stepId !== "string" ||
      typeof parsed.context !== "object" ||
      !Array.isArray(parsed.history) ||
      (parsed.status !== "active" && parsed.status !== "complete")
    ) {
      return null;
    }

    return parsed as PersistedFlowState<TContext>;
  } catch {
    return null;
  }
}
