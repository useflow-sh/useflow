import {
  type ContextUpdate,
  createInitialState,
  type FlowAction,
  type FlowContext,
  type FlowDefinition,
  type FlowState,
  flowReducer,
  type PersistedFlowState,
  restoreFlowState,
} from "@useflow/core";
import { useCallback, useReducer } from "react";

/**
 * Return type for useFlowReducer hook
 * @param TContext - The context type
 * @param TValidNextSteps - Valid step names for next() - defaults to any string
 */
export type UseFlowReducerReturn<
  TContext extends FlowContext,
  TValidNextSteps extends string = string,
> = {
  stepId: string;
  step: FlowDefinition<TContext>["steps"][string];
  context: TContext;
  status: "active" | "complete";
  history: readonly string[];
  // Overloaded next function signatures
  next: {
    (target: TValidNextSteps, update?: ContextUpdate<TContext>): void;
    (update?: ContextUpdate<TContext>): void;
  };
  back: () => void;
  setContext: (update: ContextUpdate<TContext>) => void;
  restore: (state: FlowState<TContext>) => void;
};

/**
 * Internal hook for managing flow state
 * Wraps the core reducer with React's useReducer
 *
 * This hook handles ONLY state management - no side effects.
 *
 * @internal
 * @param definition - Flow definition
 * @param initialContext - Initial context values
 * @param restoredState - Optional restored state to initialize with
 * @returns Flow state and control functions
 */
export function useFlowReducer<TContext extends FlowContext>(
  definition: FlowDefinition<TContext>,
  initialContext: TContext,
  restoredState?: PersistedFlowState<TContext> | null,
): UseFlowReducerReturn<TContext> {
  const [state, dispatch] = useReducer(
    (state: FlowState<TContext>, action: FlowAction<TContext>) =>
      flowReducer(state, action, definition),
    restoredState
      ? restoreFlowState(restoredState)
      : createInitialState(definition, initialContext),
  );

  const next = useCallback(
    (
      targetOrUpdate?: string | ContextUpdate<TContext>,
      update?: ContextUpdate<TContext>,
    ) => {
      // Determine if first arg is target (string) or update (object/function)
      if (typeof targetOrUpdate === "string") {
        dispatch({ type: "NEXT", target: targetOrUpdate, update });
      } else {
        dispatch({ type: "NEXT", update: targetOrUpdate });
      }
    },
    [],
  );

  const back = useCallback(() => {
    dispatch({ type: "BACK" });
  }, []);

  const setContext = useCallback((update: ContextUpdate<TContext>) => {
    dispatch({ type: "SET_CONTEXT", update });
  }, []);

  const restore = useCallback((restoredState: FlowState<TContext>) => {
    dispatch({ type: "RESTORE", state: restoredState });
  }, []);

  const currentStep = definition.steps[state.stepId];

  return {
    stepId: state.stepId,
    step: currentStep || {},
    context: state.context,
    status: state.status,
    history: state.history,
    next,
    back,
    setContext,
    restore,
  };
}
