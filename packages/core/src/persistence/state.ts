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
  definition: FlowDefinition,
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

  // Validate path is not empty
  if (persisted.path.length === 0) {
    errors.push("Path cannot be empty");
  } else {
    // Validate start step exists in path
    const firstInPath = persisted.path[0];
    if (firstInPath && firstInPath.stepId !== definition.start) {
      errors.push(
        `Path must start with "${definition.start}", got "${firstInPath.stepId}"`,
      );
    }

    // Validate all path steps exist
    for (const entry of persisted.path) {
      if (!stepNames.has(entry.stepId)) {
        errors.push(`Path contains non-existent step "${entry.stepId}"`);
      }
    }

    // Validate path consistency
    const lastInPath = persisted.path[persisted.path.length - 1];
    if (lastInPath && lastInPath.stepId !== persisted.stepId) {
      errors.push(
        `Current stepId "${persisted.stepId}" must match last item in path "${lastInPath.stepId}"`,
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
