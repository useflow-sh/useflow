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
import type { FlowDefinition } from "./define-flow";
import type { ExtractContext, FlowConfig, StepNames } from "./type-helpers";
import type { StepElements, StepInfo, UseFlowReturn } from "./types";
import { useFlowReducer } from "./use-flow-reducer";

// biome-ignore lint/suspicious/noExplicitAny: React Context requires concrete type at creation, type safety enforced at usage via generics
const ReactFlowContext = createContext<UseFlowReturn<any> | null>(null);

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
 *   const { context, next, back, isRestoring } = useFlow();
 *
 *   if (isRestoring) return <Spinner />;
 *
 *   return <form>...</form>;
 * }
 *
 * // Type-safe usage (recommended):
 * function ProfileStep() {
 *   const { next } = myFlow.useFlow({ step: 'profile' });
 *   next('option1'); // ✅ Type-safe!
 * }
 * ```
 */
export function useFlow<TContext extends FlowContext = FlowContext>(_options?: {
  step?: string;
}): UseFlowReturn<TContext> {
  const context = useContext(ReactFlowContext);
  if (!context) {
    throw new Error("useFlow must be used within a Flow component");
  }

  return context;
}

// biome-ignore lint/suspicious/noExplicitAny: Generic constraint allows any context type
type FlowProps<TConfig extends FlowConfig<any>> = {
  flow: FlowDefinition<TConfig>;
  children: (
    state: UseFlowReturn<ExtractContext<TConfig>, string, StepNames<TConfig>>,
  ) => ReactNode;
  initialContext: ExtractContext<TConfig>;
  instanceId?: string;
  onComplete?: () => void;
  onNext?: (event: {
    from: StepNames<TConfig>;
    to: StepNames<TConfig>;
    oldContext: ExtractContext<TConfig>;
    newContext: ExtractContext<TConfig>;
  }) => void;
  onSkip?: (event: {
    from: StepNames<TConfig>;
    to: StepNames<TConfig>;
    oldContext: ExtractContext<TConfig>;
    newContext: ExtractContext<TConfig>;
  }) => void;
  onBack?: (event: {
    from: StepNames<TConfig>;
    to: StepNames<TConfig>;
    oldContext: ExtractContext<TConfig>;
    newContext: ExtractContext<TConfig>;
  }) => void;
  onTransition?: (event: {
    from: StepNames<TConfig>;
    to: StepNames<TConfig>;
    direction: "forward" | "backward";
    oldContext: ExtractContext<TConfig>;
    newContext: ExtractContext<TConfig>;
  }) => void;
  onContextUpdate?: (event: {
    oldContext: ExtractContext<TConfig>;
    newContext: ExtractContext<TConfig>;
  }) => void;
  persister?: FlowPersister;
  saveDebounce?: number;
  saveMode?: "always" | "navigation" | "manual";
  onPersistenceError?: (error: Error) => void;
  onSave?: (state: PersistedFlowState<ExtractContext<TConfig>>) => void;
  onRestore?: (state: PersistedFlowState<ExtractContext<TConfig>>) => void;
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
 * including a renderStep helper to display the current step with typesafety for static flows.
 *
 * @param flow - FlowDefinition returned by defineFlow() (not raw config)
 * @param initialContext - Initial context state for the flow
 * @param children - Render function that receives flow state
 * @param instanceId - Optional unique identifier for reusable flows with separate persistence
 * @param persister - Optional persister for saving/restoring flow state
 * @param loadingComponent - Optional component to show while restoring state (default: null)
 *
 * @example
 * ```tsx
 * // Basic usage with renderStep helper
 * <Flow flow={myFlow} initialContext={{ name: '' }}>
 *   {({ renderStep }) => renderStep({
 *     welcome: <WelcomeStep />,
 *     profile: <ProfileStep />,
 *     complete: <CompleteStep />,
 *   })}
 * </Flow>
 *
 * // Passing context via render props to components
 * <Flow flow={myFlow} initialContext={{ name: '' }}>
 *   {({ renderStep, context, reset }) => renderStep({
 *     welcome: <WelcomeStep />,
 *     profile: <ProfileStep name={context.name} />,
 *     complete: <CompleteStep name={context.name} onReset={reset} />,
 *   })}
 * </Flow>
 *
 * // With custom layout
 * <Flow flow={myFlow} initialContext={{ name: '' }}>
 *   {({ renderStep, stepId, context }) => (
 *     <>
 *       <Header stepId={stepId} />
 *       <div className="content">
 *         {renderStep({
 *           welcome: <WelcomeStep />,
 *           profile: <ProfileStep />,
 *         })}
 *       </div>
 *       <Footer context={context} />
 *     </>
 *   )}
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
// biome-ignore lint/suspicious/noExplicitAny: Generic constraint allows any context type
export function Flow<TConfig extends FlowConfig<any>>({
  flow,
  initialContext,
  instanceId,
  onComplete,
  onNext,
  onSkip,
  onBack,
  onTransition,
  onContextUpdate,
  persister,
  saveDebounce = 300,
  saveMode = "navigation",
  onPersistenceError,
  onSave,
  onRestore,
  loadingComponent,
  children,
}: FlowProps<TConfig>) {
  // Extract config from FlowDefinition
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

  // Initialize flow state (restoration happens after mount)
  const flowState = useFlowReducer<ExtractContext<TConfig>>(
    flowDefinitionWithoutComponents,
    initialContext,
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
    ) as Record<StepNames<TConfig>, StepInfo<StepNames<TConfig>>>;
  }, [config.steps]);

  // Extract possible next steps from current step
  const nextSteps = useMemo(() => {
    const currentStep = config.steps[flowState.stepId];
    if (!currentStep?.next) return undefined;
    return typeof currentStep.next === "string"
      ? [currentStep.next]
      : currentStep.next;
  }, [config.steps, flowState.stepId]);

  // Track previous state for callbacks
  const previousStateRef = useRef(flowState);

  // Track what type of action caused the state change
  const lastActionRef = useRef<LastActionType>(null);

  // Wrap next/skip/back/setContext to track action type
  const next = useCallback(
    (
      targetOrUpdate?: string | ContextUpdate<ExtractContext<TConfig>>,
      update?: ContextUpdate<ExtractContext<TConfig>>,
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
      targetOrUpdate?: string | ContextUpdate<ExtractContext<TConfig>>,
      update?: ContextUpdate<ExtractContext<TConfig>>,
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
    (update: ContextUpdate<ExtractContext<TConfig>>) => {
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
        console.error(
          "[Flow] Failed to remove persisted state on reset:",
          error,
        );
        onPersistenceError?.(error as Error);
      }
    }
    flowState.reset();
  }, [
    flowState.reset,
    persister,
    flow.id,
    instanceId,
    config.variantId,
    onPersistenceError,
  ]);

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
        onSave?.(persistedState as PersistedFlowState<ExtractContext<TConfig>>);
      }
    } catch (error) {
      console.error("[Flow] Failed to save state:", error);
      onPersistenceError?.(error as Error);
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
    onSave,
    onPersistenceError,
  ]);

  // Handle callbacks when state changes
  useEffect(() => {
    const action = lastActionRef.current;
    if (!action) return;

    const prevState = previousStateRef.current;

    // Handle navigation callbacks
    if (action === "NEXT" && prevState.stepId !== flowState.stepId) {
      onNext?.({
        from: prevState.stepId as StepNames<TConfig>,
        to: flowState.stepId as StepNames<TConfig>,
        oldContext: prevState.context,
        newContext: flowState.context,
      });
      onTransition?.({
        from: prevState.stepId as StepNames<TConfig>,
        to: flowState.stepId as StepNames<TConfig>,
        direction: "forward",
        oldContext: prevState.context,
        newContext: flowState.context,
      });
    } else if (action === "SKIP" && prevState.stepId !== flowState.stepId) {
      onSkip?.({
        from: prevState.stepId as StepNames<TConfig>,
        to: flowState.stepId as StepNames<TConfig>,
        oldContext: prevState.context,
        newContext: flowState.context,
      });
      onTransition?.({
        from: prevState.stepId as StepNames<TConfig>,
        to: flowState.stepId as StepNames<TConfig>,
        direction: "forward",
        oldContext: prevState.context,
        newContext: flowState.context,
      });
    } else if (action === "BACK" && prevState.stepId !== flowState.stepId) {
      onBack?.({
        from: prevState.stepId as StepNames<TConfig>,
        to: flowState.stepId as StepNames<TConfig>,
        oldContext: prevState.context,
        newContext: flowState.context,
      });
      onTransition?.({
        from: prevState.stepId as StepNames<TConfig>,
        to: flowState.stepId as StepNames<TConfig>,
        direction: "backward",
        oldContext: prevState.context,
        newContext: flowState.context,
      });
    }

    // Handle context updates
    if (action === "SET_CONTEXT" || action === "NEXT" || action === "SKIP") {
      if (prevState.context !== flowState.context) {
        onContextUpdate?.({
          oldContext: prevState.context,
          newContext: flowState.context,
        });
      }
    }

    // Handle onComplete callback
    if (flowState.status === "complete" && prevState.status !== "complete") {
      onComplete?.();
    }

    previousStateRef.current = flowState;
  }, [
    flowState,
    onNext,
    onSkip,
    onBack,
    onTransition,
    onContextUpdate,
    onComplete,
  ]);

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
          migrate: flow.runtimeConfig?.migrate as MigrateFunction | undefined,
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
            console.warn(
              "[Flow] Persisted state validation failed:",
              validation.errors,
            );
            onPersistenceError?.(
              new Error(
                `Invalid persisted state: ${validation.errors?.join(", ")}`,
              ),
            );
            return;
          }

          // Safe cast: persister returns base FlowContext, but we've validated
          // the structure matches this flow. Context shape is trusted based on:
          // 1. FlowId matching (same flow that saved it)
          // 2. Version checking + migration
          // 3. Custom validate function in persister options
          // TODO: add context shape validation from flow definition
          const typedState = state as PersistedFlowState<
            ExtractContext<TConfig>
          >;
          flowState.restore(typedState);
          onRestore?.(typedState);
        }
      } catch (error) {
        console.error("[Flow] Failed to restore state:", error);
        onPersistenceError?.(error as Error);
      } finally {
        setIsRestoring(false);
      }
    };

    restoreFlowState();
  }, [
    persister,
    flow.id,
    flow.runtimeConfig?.migrate,
    instanceId,
    config,
    onPersistenceError,
    onRestore,
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
    (elements: StepElements<StepNames<TConfig>>): ReactElement => {
      return elements[flowState.stepId as StepNames<TConfig>];
    },
    [flowState.stepId],
  );

  // Show loading component while restoring to prevent flash of wrong content
  if (isRestoring) {
    return <>{loadingComponent ?? null}</>;
  }

  // Create the flow state object to pass to children
  const flowRenderState: UseFlowReturn<
    ExtractContext<TConfig>,
    string,
    StepNames<TConfig>
  > = {
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
    renderStep,
  };

  return (
    <ReactFlowContext.Provider value={flowRenderState}>
      {children(flowRenderState)}
    </ReactFlowContext.Provider>
  );
}
