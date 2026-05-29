import type {
  ContextUpdate,
  FlowContext,
  FlowPersister,
  MigrateFunction,
  PersistedFlowState,
} from "@useflow/core";
import { validatePersistedState } from "@useflow/core";
import {
  createContext,
  type ReactElement,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { RuntimeFlowDefinition } from "./define-flow";
import { useFlowConfig } from "./provider";
import type {
  ExtractAllStepNames,
  ExtractFlowContext,
  FlowDefinition,
  FlowRenderState,
  StepElements,
  StepInfo,
  UseFlowReturn,
} from "./types";
import { useFlowReducer } from "./use-flow-reducer";

// biome-ignore lint/suspicious/noExplicitAny: React Context requires concrete type at creation, type safety enforced at usage via generics
const ReactFlowContext = createContext<UseFlowReturn<any, any, any> | null>(
  null,
);

/**
 * Get the current flow state from context
 *
 * Use this directly in components when you don't need type-safe navigation,
 * or use the custom hook from defineFlow for full type safety.
 *
 * @example
 * ```tsx
 * // Direct usage (no type safety for navigation)
 * function MyStep() {
 *   const { context, next, back, isRestoring } = useFlowState();
 *
 *   if (isRestoring) return <Spinner />;
 *
 *   return <form>...</form>;
 * }
 *
 * // Type-safe usage (recommended):
 * function ProfileStep() {
 *   const { next } = myFlow.useFlowState({ step: 'profile' });
 *   next('option1'); // ✅ Type-safe!
 * }
 * ```
 */
export function useFlowState<
  TContext extends FlowContext = FlowContext,
>(_options?: { step?: string }): UseFlowReturn<TContext> {
  const context = useContext(ReactFlowContext);
  if (!context) {
    throw new Error("useFlowState must be used within a Flow component");
  }

  return context;
}

// Constraint using FlowDefinition without type parameter preserves steps structure
// biome-ignore lint/suspicious/noExplicitAny: Generic constraint requires 'any' for flexible context type inference
type FlowProps<TFlow extends RuntimeFlowDefinition<FlowDefinition, any>> = {
  flow: TFlow;
  children: (state: FlowRenderState<TFlow>) => ReactNode;
  initialContext?: ExtractFlowContext<TFlow>;
  instanceId?: string;
  onComplete?: (event: { context: ExtractFlowContext<TFlow> }) => void;
  onNext?: (event: {
    from: ExtractAllStepNames<TFlow> & string;
    to: ExtractAllStepNames<TFlow> & string;
    oldContext: ExtractFlowContext<TFlow>;
    newContext: ExtractFlowContext<TFlow>;
  }) => void;
  onSkip?: (event: {
    from: ExtractAllStepNames<TFlow> & string;
    to: ExtractAllStepNames<TFlow> & string;
    oldContext: ExtractFlowContext<TFlow>;
    newContext: ExtractFlowContext<TFlow>;
  }) => void;
  onBack?: (event: {
    from: ExtractAllStepNames<TFlow> & string;
    to: ExtractAllStepNames<TFlow> & string;
    oldContext: ExtractFlowContext<TFlow>;
    newContext: ExtractFlowContext<TFlow>;
  }) => void;
  onTransition?: (event: {
    from: ExtractAllStepNames<TFlow> & string;
    to: ExtractAllStepNames<TFlow> & string;
    direction: "forward" | "backward";
    oldContext: ExtractFlowContext<TFlow>;
    newContext: ExtractFlowContext<TFlow>;
  }) => void;
  onContextUpdate?: (event: {
    oldContext: ExtractFlowContext<TFlow>;
    newContext: ExtractFlowContext<TFlow>;
  }) => void;
  persister?: FlowPersister;
  saveDebounce?: number;
  saveMode?: "always" | "navigation" | "manual";
  onPersistenceError?: (error: Error) => void;
  onSave?: (state: PersistedFlowState<ExtractFlowContext<TFlow>>) => void;
  onRestore?: (state: PersistedFlowState<ExtractFlowContext<TFlow>>) => void;
  loadingComponent?: ReactNode;
};

type LastActionType =
  | "NEXT"
  | "SKIP"
  | "BACK"
  | "SET_CONTEXT"
  | "RESTORE"
  | "RESET"
  | null;
/**
 * Flow - main component for running a flow using render props pattern
 *
 * Uses children as a function that receives flow state and methods,
 * including a renderStep helper to display the current step. Works with
 * single flows or multiple flows selected at runtime (union types).
 *
 * @param flow - RuntimeFlowDefinition returned by defineFlow() (not raw config)
 * @param initialContext - Initial context state for the flow (optional, defaults to {})
 * @param children - Render function that receives flow state
 * @param instanceId - Optional unique identifier for reusable flows with separate persistence
 * @param persister - Optional persister for saving/restoring flow state
 * @param loadingComponent - Optional component to show while restoring state (default: null)
 *
 * @example
 * ```tsx
 * // Basic usage (no context needed)
 * <Flow flow={myFlow}>
 *   {({ renderStep }) => renderStep({
 *     welcome: <WelcomeStep />,
 *     profile: <ProfileStep />,
 *     complete: <CompleteStep />,
 *   })}
 * </Flow>
 *
 * // With initial context
 * <Flow flow={myFlow} initialContext={{ name: '' }}>
 *   {({ renderStep }) => renderStep({
 *     welcome: <WelcomeStep />,
 *     profile: <ProfileStep />,
 *     complete: <CompleteStep />,
 *   })}
 * </Flow>
 *
 * // With dynamically selected flows
 * const selectedFlow = condition ? flowA : flowB;
 * <Flow flow={selectedFlow} initialContext={{ name: '' }}>
 *   {({ renderStep }) => renderStep({
 *     // All possible steps from all flows must be provided
 *     welcome: <WelcomeStep />,
 *     stepA: <StepA />,  // Only in flowA
 *     stepB: <StepB />,  // Only in flowB
 *   })}
 * </Flow>
 *
 * // Passing context via render props
 * <Flow flow={myFlow} initialContext={{ name: '' }}>
 *   {({ renderStep, context, reset }) => renderStep({
 *     welcome: <WelcomeStep />,
 *     profile: <ProfileStep name={context.name} />,
 *     complete: <CompleteStep name={context.name} onReset={reset} />,
 *   })}
 * </Flow>
 *
 * // With persistence
 * <Flow
 *   flow={myFlow}
 *   initialContext={{ name: '' }}
 *   persister={persister}
 *   loadingComponent={<Spinner />}
 * >
 *   {({ renderStep }) => renderStep({
 *     welcome: <WelcomeStep />,
 *     profile: <ProfileStep />,
 *   })}
 * </Flow>
 * ```
 */
// biome-ignore lint/suspicious/noExplicitAny: Generic constraint requires 'any' for flexible context type inference
export function Flow<TFlow extends RuntimeFlowDefinition<FlowDefinition, any>>({
  flow,
  initialContext,
  instanceId,
  onComplete,
  onNext,
  onSkip,
  onBack,
  onTransition,
  onContextUpdate,
  persister: persisterProp,
  saveDebounce: saveDebounceProp,
  saveMode: saveModeProp,
  onPersistenceError: onPersistenceErrorProp,
  onSave,
  onRestore,
  loadingComponent,
  children,
}: FlowProps<TFlow>) {
  // Get global config from provider (if available)
  const globalConfig = useFlowConfig();

  // Merge global and local config (local props override global)
  const persister = persisterProp ?? globalConfig?.persister;
  const saveDebounce = saveDebounceProp ?? globalConfig?.saveDebounce ?? 300;
  const saveMode = saveModeProp ?? globalConfig?.saveMode ?? "navigation";
  const onPersistenceError =
    onPersistenceErrorProp ?? globalConfig?.onPersistenceError;

  // Stable refs for callback props to decouple them from hook dependency arrays
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;
  const onPersistenceErrorRef = useRef(onPersistenceError);
  onPersistenceErrorRef.current = onPersistenceError;
  const onRestoreRef = useRef(onRestore);
  onRestoreRef.current = onRestore;
  const onNextRef = useRef(onNext);
  onNextRef.current = onNext;
  const onSkipRef = useRef(onSkip);
  onSkipRef.current = onSkip;
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;
  const onTransitionRef = useRef(onTransition);
  onTransitionRef.current = onTransition;
  const onContextUpdateRef = useRef(onContextUpdate);
  onContextUpdateRef.current = onContextUpdate;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  // Extract config from RuntimeFlowDefinition
  const { id, config } = flow;

  const flowDefinitionWithoutComponents = useMemo(
    () => ({
      id,
      start: config.start,
      steps: config.steps,
    }),
    [id, config],
  );

  // Track if we're currently restoring state from persister
  const [isRestoring, setIsRestoring] = useState(!!persister);

  type StepId = ExtractAllStepNames<TFlow> & string;

  // Initialize flow state (restoration happens after mount)
  const flowState = useFlowReducer<ExtractFlowContext<TFlow>, string, StepId>(
    flowDefinitionWithoutComponents,
    initialContext ?? ({} as ExtractFlowContext<TFlow>),
    undefined, // initialState - restoration happens in useEffect
    // Safe cast: ResolverMap is a stricter compile-time type, runtime shape matches RuntimeResolverMap
    // biome-ignore lint/suspicious/noExplicitAny: Runtime resolver map is compatible
    flow.runtimeConfig?.resolvers as any,
  );

  // Extract all steps (stripped down to only next property)
  const steps = useMemo(() => {
    return Object.fromEntries(
      Object.entries(config.steps).map(([id, step]) => [
        id,
        { next: step.next },
      ]),
    ) as Record<StepId, StepInfo<StepId>>;
  }, [config.steps]);

  // Extract possible next steps from current step
  const nextSteps = useMemo<readonly StepId[] | undefined>(() => {
    const currentStep = steps[flowState.stepId];
    if (!currentStep?.next) return undefined;
    return typeof currentStep.next === "string"
      ? [currentStep.next]
      : currentStep.next;
  }, [steps, flowState.stepId]);

  // Track previous state for callbacks
  const previousStateRef = useRef(flowState);

  // Track what type of action caused the state change
  const lastActionRef = useRef<LastActionType>(null);

  // Track if flow has started (for global onFlowStart callback)
  const hasStartedRef = useRef(false);

  // Wrap next/skip/back/setContext to track action type
  const next = useCallback(
    (
      targetOrUpdate?: string | ContextUpdate<ExtractFlowContext<TFlow>>,
      update?: ContextUpdate<ExtractFlowContext<TFlow>>,
    ) => {
      lastActionRef.current = "NEXT";
      if (typeof targetOrUpdate === "string") {
        flowState.next(targetOrUpdate, update);
      } else {
        flowState.next(targetOrUpdate);
      }
    },
    [flowState],
  );

  const skip = useCallback(
    (
      targetOrUpdate?: string | ContextUpdate<ExtractFlowContext<TFlow>>,
      update?: ContextUpdate<ExtractFlowContext<TFlow>>,
    ) => {
      lastActionRef.current = "SKIP";
      if (typeof targetOrUpdate === "string") {
        flowState.skip(targetOrUpdate, update);
      } else {
        flowState.skip(targetOrUpdate);
      }
    },
    [flowState.skip],
  );

  const back = useCallback(() => {
    lastActionRef.current = "BACK";
    flowState.back();
  }, [flowState.back]);

  const setContext = useCallback(
    (update: ContextUpdate<ExtractFlowContext<TFlow>>) => {
      lastActionRef.current = "SET_CONTEXT";
      flowState.setContext(update);
    },
    [flowState.setContext],
  );

  const reset = useCallback(async () => {
    lastActionRef.current = "RESET";
    // Clear persisted state if persister is available
    if (persister) {
      try {
        await persister.remove?.(flow.id, {
          instanceId,
          variantId: config.variantId,
        });
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.error(
            "[Flow] Failed to remove persisted state on reset:",
            error,
          );
        }
        onPersistenceErrorRef.current?.(error as Error);
      }
    }
    flowState.reset();
  }, [flowState.reset, persister, flow.id, instanceId, config.variantId]);

  const save = useCallback(async () => {
    if (!persister) return;
    try {
      const version =
        "version" in config
          ? (config as { version?: string }).version
          : undefined;

      // Extract only the persistable state (no methods)
      const stateToSave = {
        stepId: flowState.stepId,
        context: flowState.context,
        path: flowState.path,
        history: flowState.history,
        status: flowState.status,
        startedAt: flowState.startedAt,
        completedAt: flowState.completedAt,
      };

      const persistedState = await persister.save(flow.id, stateToSave, {
        version,
        instanceId,
        variantId: config.variantId,
      });

      if (persistedState) {
        onSaveRef.current?.(
          persistedState as PersistedFlowState<ExtractFlowContext<TFlow>>,
        );
      }
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[Flow] Failed to save state:", error);
      }
      onPersistenceErrorRef.current?.(error as Error);
    } finally {
      // Reset action ref after save settles to prevent duplicate saves or infinite loops on subsequent re-renders
      lastActionRef.current = null;
    }
  }, [
    flow.id,
    flowState.stepId,
    flowState.context,
    flowState.path,
    flowState.history,
    flowState.status,
    flowState.startedAt,
    flowState.completedAt,
    config,
    instanceId,
    persister,
  ]);

  // Fire global onFlowStart callback once on mount
  useEffect(() => {
    if (!hasStartedRef.current && !isRestoring) {
      hasStartedRef.current = true;
      globalConfig?.callbacks?.onFlowStart?.({
        flowId: flow.id,
        variantId: config.variantId,
        instanceId,
        context: flowState.context,
      });
    }
  }, [
    flow.id,
    config.variantId,
    instanceId,
    flowState.context,
    globalConfig,
    isRestoring,
  ]);

  // Handle callbacks when state changes
  useEffect(() => {
    const action = lastActionRef.current;
    if (!action) return;

    const prevState = previousStateRef.current;

    // Handle navigation callbacks
    if (action === "NEXT" && prevState.stepId !== flowState.stepId) {
      onNextRef.current?.({
        from: prevState.stepId,
        to: flowState.stepId,
        oldContext: prevState.context,
        newContext: flowState.context,
      });
      onTransitionRef.current?.({
        from: prevState.stepId,
        to: flowState.stepId,
        direction: "forward",
        oldContext: prevState.context,
        newContext: flowState.context,
      });
      // Global transition callback
      globalConfig?.callbacks?.onStepTransition?.({
        flowId: flow.id,
        variantId: config.variantId,
        instanceId,
        from: prevState.stepId,
        to: flowState.stepId,
        direction: "forward",
        oldContext: prevState.context,
        newContext: flowState.context,
      });
    } else if (action === "SKIP" && prevState.stepId !== flowState.stepId) {
      onSkipRef.current?.({
        from: prevState.stepId,
        to: flowState.stepId,
        oldContext: prevState.context,
        newContext: flowState.context,
      });
      onTransitionRef.current?.({
        from: prevState.stepId,
        to: flowState.stepId,
        direction: "forward",
        oldContext: prevState.context,
        newContext: flowState.context,
      });
      // Global transition callback
      globalConfig?.callbacks?.onStepTransition?.({
        flowId: flow.id,
        variantId: config.variantId,
        instanceId,
        from: prevState.stepId,
        to: flowState.stepId,
        direction: "forward",
        oldContext: prevState.context,
        newContext: flowState.context,
      });
    } else if (action === "BACK" && prevState.stepId !== flowState.stepId) {
      onBackRef.current?.({
        from: prevState.stepId,
        to: flowState.stepId,
        oldContext: prevState.context,
        newContext: flowState.context,
      });
      onTransitionRef.current?.({
        from: prevState.stepId,
        to: flowState.stepId,
        direction: "backward",
        oldContext: prevState.context,
        newContext: flowState.context,
      });
      // Global transition callback
      globalConfig?.callbacks?.onStepTransition?.({
        flowId: flow.id,
        variantId: config.variantId,
        instanceId,
        from: prevState.stepId,
        to: flowState.stepId,
        direction: "backward",
        oldContext: prevState.context,
        newContext: flowState.context,
      });
    }

    // Handle context updates
    if (action === "SET_CONTEXT" || action === "NEXT" || action === "SKIP") {
      if (prevState.context !== flowState.context) {
        onContextUpdateRef.current?.({
          oldContext: prevState.context,
          newContext: flowState.context,
        });
      }
    }

    // Handle onComplete callback
    if (flowState.status === "complete" && prevState.status !== "complete") {
      onCompleteRef.current?.({ context: flowState.context });
      // Global complete callback
      globalConfig?.callbacks?.onFlowComplete?.({
        flowId: flow.id,
        variantId: config.variantId,
        instanceId,
        context: flowState.context,
      });
    }

    previousStateRef.current = flowState;
  }, [flowState, globalConfig, flow.id, config.variantId, instanceId]);

  // Handle async restoration from persister after mount
  useEffect(() => {
    if (!persister) {
      setIsRestoring(false);
      return;
    }

    const restoreFlowState = async () => {
      try {
        const state = await persister.restore(flow.id, {
          version: config.version,
          migrate: flow.runtimeConfig?.migration as MigrateFunction | undefined,
          instanceId,
          variantId: config.variantId,
        });

        if (state) {
          // Validate state is compatible with this flow's definition
          const validation = validatePersistedState(
            state,
            flowDefinitionWithoutComponents,
          );
          if (!validation.valid) {
            if (process.env.NODE_ENV !== "production") {
              console.warn(
                "[Flow] Persisted state validation failed:",
                validation.errors,
              );
            }
            onPersistenceErrorRef.current?.(
              new Error(
                `Invalid persisted state: ${validation.errors?.join(", ")}`,
              ),
            );
            return;
          }

          // Safe cast: persister returns base FlowContext, but we've validated
          //  the structure matches this flow. Context shape is trusted based on:
          // 1. FlowId matching (same flow that saved it)
          // 2. Version checking + migration
          // 3. Custom validate function in persister options
          // TODO: add context shape validation from flow definition
          const typedState = state as PersistedFlowState<
            ExtractFlowContext<TFlow>
          >;
          flowState.restore(typedState);
          onRestoreRef.current?.(typedState);
        }
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.error("[Flow] Failed to restore state:", error);
        }
        onPersistenceErrorRef.current?.(error as Error);
      } finally {
        setIsRestoring(false);
      }
    };

    restoreFlowState();
  }, [
    persister,
    flow.id,
    flow.runtimeConfig?.migration,
    instanceId,
    config,
    flowState.restore,
    flowDefinitionWithoutComponents,
  ]);

  // Handle persistence
  useEffect(() => {
    // Check if we should save based on saveMode
    if (saveMode === "manual") return;

    const action = lastActionRef.current;
    if (
      saveMode === "navigation" &&
      action !== "NEXT" &&
      action !== "SKIP" &&
      action !== "BACK"
    )
      return;

    if (saveDebounce && saveDebounce > 0) {
      const timer = setTimeout(() => {
        save();
      }, saveDebounce);
      return () => clearTimeout(timer);
    }

    save();
  }, [saveMode, saveDebounce, save]);

  // Create renderStep helper function
  const renderStep = useCallback(
    (elements: StepElements<StepId>): ReactElement => {
      return elements[flowState.stepId];
    },
    [flowState.stepId],
  );

  // Show loading component while restoring to prevent flash of wrong content
  if (isRestoring) {
    return <>{loadingComponent ?? null}</>;
  }

  // Create the flow state object to pass to children
  const flowRenderState = {
    // From flowState
    stepId: flowState.stepId,
    step: flowState.step,
    context: flowState.context,
    path: flowState.path,
    history: flowState.history,
    status: flowState.status,
    startedAt: flowState.startedAt,
    completedAt: flowState.completedAt,
    restore: flowState.restore,
    // Methods (stable via useCallback)
    next,
    skip,
    back,
    setContext,
    reset,
    save,
    // Additional properties
    isRestoring,
    steps,
    nextSteps,
    // Computed navigation flags
    canGoBack: flowState.path.length > 1,
    canGoNext: nextSteps !== undefined,
    renderStep,
  } as FlowRenderState<TFlow>;

  return (
    <ReactFlowContext.Provider value={flowRenderState}>
      {children(flowRenderState)}
    </ReactFlowContext.Provider>
  );
}
