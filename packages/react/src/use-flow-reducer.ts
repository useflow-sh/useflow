import {
  type ContextUpdate,
  type FlowDefinition as CoreFlowDefinition,
  createInitialState,
  type FlowAction,
  type FlowContext,
  type FlowState,
  flowReducer,
  type HistoryEntry,
  type PathEntry,
  type RuntimeResolverMap,
  type StepDefinition,
  type StepTransition,
} from "@useflow/core";
import { useCallback, useReducer, useRef } from "react";

/**
 * FlowDefinition is an alias for core's FlowDefinition
 * Used for type constraints in defineFlow
 */
export type FlowDefinition<
  TSteps extends Record<string, StepDefinition<StepTransition>> = Record<
    string,
    StepDefinition<StepTransition>
  >,
> = CoreFlowDefinition<TSteps>;

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
  step: CoreFlowDefinition["steps"][string];
  context: TContext;
  status: "active" | "complete";
  /** Path taken through the flow - used for back navigation */
  path: PathEntry[];
  /** Complete navigation history with timestamps - tracks all movements */
  history: HistoryEntry[];
  /** When the flow was started (first step entered) */
  startedAt: number;
  /** When the flow was completed (undefined if still active) */
  completedAt?: number;
  // Overloaded next function signatures
  next: {
    (target: TValidNextSteps, update?: ContextUpdate<TContext>): void;
    (update?: ContextUpdate<TContext>): void;
  };
  // Overloaded skip function signatures
  skip: {
    (target: TValidNextSteps, update?: ContextUpdate<TContext>): void;
    (update?: ContextUpdate<TContext>): void;
  };
  back: () => void;
  setContext: (update: ContextUpdate<TContext>) => void;
  restore: (state: FlowState<TContext>) => void;
  reset: () => void;
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
 * @param initialState - Optional initial state to restore
 * @param resolvers - Optional resolver map for context-driven navigation
 * @returns Flow state and control functions
 */
export function useFlowReducer<TContext extends FlowContext>(
  definition: CoreFlowDefinition,
  initialContext: TContext,
  initialState?: FlowState<TContext>,
  resolvers?: RuntimeResolverMap<TContext>,
): UseFlowReducerReturn<TContext> {
  // Store initial context in a ref so it's stable across re-renders
  const initialContextRef = useRef(initialContext);

  const [state, dispatch] = useReducer(
    (state: FlowState<TContext>, action: FlowAction<TContext>) =>
      flowReducer(state, action, definition, { resolvers }),
    initialState ?? createInitialState(definition, initialContext),
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

  const skip = useCallback(
    (
      targetOrUpdate?: string | ContextUpdate<TContext>,
      update?: ContextUpdate<TContext>,
    ) => {
      // Determine if first arg is target (string) or update (object/function)
      if (typeof targetOrUpdate === "string") {
        dispatch({ type: "SKIP", target: targetOrUpdate, update });
      } else {
        dispatch({ type: "SKIP", update: targetOrUpdate });
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

  const reset = useCallback(() => {
    dispatch({ type: "RESET", initialContext: initialContextRef.current });
  }, []);

  const currentStep = definition.steps[state.stepId];

  return {
    stepId: state.stepId,
    step: currentStep || {},
    context: state.context,
    status: state.status,
    path: state.path,
    history: state.history,
    startedAt: state.startedAt,
    completedAt: state.completedAt,
    next,
    skip,
    back,
    setContext,
    restore,
    reset,
  };
}
