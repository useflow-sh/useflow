import type {
  ContextUpdate,
  FlowAction,
  FlowContext,
  FlowDefinition,
  FlowState,
} from "./types";

/**
 * Validates a flow definition to ensure all step references exist
 * Throws errors for invalid references to fail fast during development
 * @param definition - Flow definition to validate
 * @throws Error if start step or any next references don't exist
 */
export function validateFlowDefinition<TContext extends FlowContext>(
  definition: FlowDefinition<TContext>,
): void {
  const stepNames = new Set(Object.keys(definition.steps));
  const errors: string[] = [];

  // Validate start step exists
  if (!stepNames.has(definition.start)) {
    errors.push(
      `Start step "${definition.start}" does not exist in steps. ` +
        `Available steps: ${Array.from(stepNames).join(", ")}`,
    );
  }

  // Validate each step's next references
  for (const [stepId, step] of Object.entries(definition.steps)) {
    if (!step.next) continue;

    const validateStepRef = (ref: string, source: string) => {
      if (!stepNames.has(ref)) {
        errors.push(
          `Step "${stepId}" references non-existent step "${ref}" in ${source}. ` +
            `Available steps: ${Array.from(stepNames).join(", ")}`,
        );
      }
    };

    if (typeof step.next === "string") {
      validateStepRef(step.next, "next");
    } else if (Array.isArray(step.next)) {
      for (const ref of step.next) {
        validateStepRef(ref, "next array");
      }
    }
    // Note: Can't validate function returns statically, only at runtime
  }

  if (errors.length > 0) {
    throw new Error(
      `[FlowDefinition] Invalid flow definition:\n${errors.map((e) => `  - ${e}`).join("\n")}`,
    );
  }
}

/**
 * Applies a context update to the current context
 * - Object updates: shallow merge with current context
 * - Function updates: return value becomes the new context
 */
function applyContextUpdate<TContext extends FlowContext>(
  current: TContext,
  update: ContextUpdate<TContext>,
): TContext {
  if (typeof update === "function") {
    // Function has full control - use return value as-is
    return update(current) as TContext;
  }
  // Object updates always merge
  return { ...current, ...update };
}

/**
 * Creates the initial state for a flow
 * @param definition - Flow definition
 * @param initialContext - Initial context values
 * @returns Initial flow state
 */
export function createInitialState<TContext extends FlowContext>(
  definition: FlowDefinition<TContext>,
  initialContext: TContext,
): FlowState<TContext> {
  return {
    stepId: definition.start,
    context: initialContext,
    history: [definition.start],
    status: "active",
  };
}

/**
 * Pure reducer for flow state transitions
 * Framework-agnostic - works with React, Vue, Svelte, or vanilla JS
 *
 * @param state - Current flow state
 * @param action - Action to perform
 * @param definition - Flow definition
 * @returns New flow state
 */
export function flowReducer<TContext extends FlowContext>(
  state: FlowState<TContext>,
  action: FlowAction<TContext>,
  definition: FlowDefinition<TContext>,
): FlowState<TContext> {
  switch (action.type) {
    case "SET_CONTEXT": {
      return {
        ...state,
        context: applyContextUpdate(state.context, action.update),
      };
    }

    case "NEXT": {
      // First apply context update if provided
      const updatedContext = action.update
        ? applyContextUpdate(state.context, action.update)
        : state.context;

      const updatedState =
        action.update !== undefined
          ? { ...state, context: updatedContext }
          : state;

      const step = definition.steps[updatedState.stepId];

      // No next step = final state
      if (!step?.next) {
        return { ...updatedState, status: "complete" };
      }

      let nextStepId: string | undefined;

      // If target is explicitly specified, use it
      if (action.target) {
        // Validate target is in the allowed next destinations
        if (typeof step.next === "string") {
          nextStepId = step.next === action.target ? action.target : undefined;
        } else if (Array.isArray(step.next)) {
          nextStepId = step.next.includes(action.target)
            ? action.target
            : undefined;
        }

        // Validation: target not in allowed destinations
        if (nextStepId === undefined) {
          const allowed =
            typeof step.next === "string" ? step.next : step.next.join(", ");
          console.warn(
            `Invalid target "${action.target}" from step "${updatedState.stepId}". Allowed: ${allowed}`,
          );
          return updatedState;
        }
      } else {
        // No target specified - determine next step automatically
        if (typeof step.next === "string") {
          // String: simple static navigation
          nextStepId = step.next;
        } else if (Array.isArray(step.next)) {
          // Array: check for resolve function
          if (step.resolve) {
            // Context-driven: use resolve to determine next step
            const resolved = step.resolve(updatedContext);

            // Validate resolved value is in next array
            if (resolved && !step.next.includes(resolved)) {
              throw new Error(
                `resolve() returned "${resolved}" which is not in next array: [${step.next.join(", ")}] ` +
                  `for step "${updatedState.stepId}"`,
              );
            }

            nextStepId = resolved;
          } else {
            // Component-driven but no explicit target - ERROR
            throw new Error(
              `Step "${updatedState.stepId}" has multiple next steps [${step.next.join(", ")}] but no resolve function. ` +
                `Component must call next() with explicit target: ${step.next.map((s) => `next('${s}')`).join(" or ")}`,
            );
          }
        }
      }

      // Guard: undefined means stay on current step
      if (nextStepId === undefined) {
        return updatedState;
      }

      // Check if the next step is final (has no next)
      const nextStep = definition.steps[nextStepId];
      const isFinalStep = !nextStep?.next;

      // Navigate to next step
      return {
        ...updatedState,
        stepId: nextStepId,
        history: [...updatedState.history, nextStepId],
        status: isFinalStep ? "complete" : "active",
      };
    }

    case "BACK": {
      if (state.history.length <= 1) {
        return state;
      }

      const newHistory = state.history.slice(0, -1);
      const previousStepId = newHistory[newHistory.length - 1];

      return {
        ...state,
        // biome-ignore lint/style/noNonNullAssertion: should always be defined since we check history.length > 1
        stepId: previousStepId!,
        history: newHistory,
      };
    }

    case "RESTORE": {
      // Replace the entire state with the restored state
      return action.state;
    }

    case "RESET": {
      // Reset to initial state - use the definition's start step
      // and the provided initial context
      return createInitialState(definition, action.initialContext);
    }

    default: {
      // Warn about unknown action types (should never happen with TypeScript)
      console.warn(
        `[flowReducer] Unknown action type: ${(action as { type?: string }).type}`,
      );
      return state;
    }
  }
}
