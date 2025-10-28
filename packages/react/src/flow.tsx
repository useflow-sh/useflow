import type {
  ContextUpdate,
  FlowContext,
  FlowPersister,
  PersistedFlowState,
} from "@useflow/core";
import { validatePersistedState } from "@useflow/core";
import {
  type ComponentType,
  createContext,
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
import type { RuntimeFlowDefinition, UseFlowReturn } from "./types";
import { type UseFlowReducerReturn, useFlowReducer } from "./use-flow-reducer";

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
type ComponentsFunction<TConfig extends FlowConfig<any>> = (flowState: {
  context: ExtractContext<TConfig>;
  stepId: StepNames<TConfig>;
  status: "active" | "complete";
  history: readonly string[];
  next: UseFlowReducerReturn<ExtractContext<TConfig>>["next"];
  back: () => void;
  setContext: (update: ContextUpdate<ExtractContext<TConfig>>) => void;
  isRestoring: boolean;
  // biome-ignore lint/suspicious/noExplicitAny: Components can accept arbitrary props defined by users
}) => Record<StepNames<TConfig>, ComponentType<any>>;

// biome-ignore lint/suspicious/noExplicitAny: Components can accept arbitrary props defined by users
type ComponentsDict<TConfig extends FlowConfig<any>> = Record<
  StepNames<TConfig>,
  // biome-ignore lint/suspicious/noExplicitAny: Components can accept arbitrary props defined by users
  ComponentType<any>
>;

// biome-ignore lint/suspicious/noExplicitAny: Generic constraint allows any context type
type ComponentsProp<TConfig extends FlowConfig<any>> =
  | ComponentsDict<TConfig>
  | ComponentsFunction<TConfig>;

// biome-ignore lint/suspicious/noExplicitAny: Generic constraint allows any context type
type FlowProps<TConfig extends FlowConfig<any>> = {
  flow: FlowDefinition<TConfig>;
  components: ComponentsProp<TConfig>;
  initialContext: ExtractContext<TConfig>;
  instanceId?: string;
  onComplete?: () => void;
  onNext?: (event: {
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
  children?: ReactNode;
};

/**
 * Flow - main component for running a flow
 *
 * By default, renders the current step automatically if no children provided.
 * Use FlowStep component for custom layout control.
 *
 * @param flow - FlowDefinition returned by defineFlow() (not raw config)
 * @param instanceId - Optional unique identifier for reusable flows with separate persistence
 * @param persister - Optional persister for saving/restoring flow state
 * @param loadingComponent - Optional component to show while restoring state (default: null)
 *
 * @example
 * ```tsx
 * // First, define your flow
 * const myFlow = defineFlow({
 *   start: 'welcome',
 *   steps: { ... }
 * } as const satisfies FlowConfig<MyContext>);
 *
 * // Auto-render (default) - step renders automatically
 * <Flow
 *   flow={myFlow}
 *   components={(flowState) => ({
 *     welcome: WelcomeStep,
 *     complete: () => <CompleteStep {...flowState.context} />
 *   })}
 *   initialContext={{ name: '' }}
 * />
 *
 * // Reusable flow with instanceId (separate state per task)
 * <Flow
 *   flow={feedbackFlow}
 *   instanceId={task.id}
 *   components={(flowState) => ({ ... })}
 *   initialContext={{ taskName: task.name }}
 *   persister={persister}
 * />
 *
 * // With persistence and loading state
 * <Flow
 *   flow={myFlow}
 *   components={(flowState) => ({ ... })}
 *   initialContext={{ name: '' }}
 *   persister={persister}
 *   loadingComponent={<Spinner />}
 * />
 *
 * // Custom layout - use FlowStep for control
 * <Flow
 *   flow={myFlow}
 *   components={(flowState) => ({
 *     welcome: WelcomeStep,
 *     complete: () => <CompleteStep {...flowState.context} />
 *   })}
 *   initialContext={{ name: '' }}
 * >
 *   <Header />
 *   <FlowStep />
 *   <Footer />
 * </Flow>
 * ```
 */
// biome-ignore lint/suspicious/noExplicitAny: Generic constraint allows any context type
export function Flow<TConfig extends FlowConfig<any>>({
  flow,
  components,
  initialContext,
  instanceId,
  onComplete,
  onNext,
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
  );

  // Track previous state for callbacks
  const previousStateRef = useRef(flowState);

  // Track what type of action caused the state change
  type LastActionType = "NEXT" | "BACK" | "SET_CONTEXT" | "RESTORE" | null;
  const lastActionRef = useRef<LastActionType>(null);

  // Wrap next/back/setContext to track action type
  const wrappedNext = useCallback(
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

  const wrappedBack = useCallback(() => {
    lastActionRef.current = "BACK";
    flowState.back();
  }, [flowState.back]);

  const wrappedSetContext = useCallback(
    (update: ContextUpdate<ExtractContext<TConfig>>) => {
      lastActionRef.current = "SET_CONTEXT";
      flowState.setContext(update);
    },
    [flowState.setContext],
  );

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
    if (action === "SET_CONTEXT" || action === "NEXT") {
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
  }, [flowState, onNext, onBack, onTransition, onContextUpdate, onComplete]);

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
        history: flowState.history,
        status: flowState.status,
      };

      const persistedState = await persister.save(flow.id, stateToSave, {
        version,
        instanceId,
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
    flowState.history,
    flowState.status,
    config,
    instanceId,
    persister,
    onSave,
    onPersistenceError,
  ]);

  // Handle persistence
  useEffect(() => {
    // Check if we should save based on saveMode
    if (saveMode === "manual") return;

    const action = lastActionRef.current;
    if (saveMode === "navigation" && action !== "NEXT" && action !== "BACK")
      return;

    if (saveDebounce && saveDebounce > 0) {
      const timer = setTimeout(() => {
        save();
      }, saveDebounce);
      return () => clearTimeout(timer);
    }

    save();
  }, [saveMode, saveDebounce, save]);

  // Resolve components - either use directly if dict, or call function if it's a function
  const resolvedComponents = useMemo(
    () =>
      typeof components === "function"
        ? components({
            context: flowState.context,
            stepId: flowState.stepId as StepNames<TConfig>,
            status: flowState.status,
            history: flowState.history,
            next: wrappedNext,
            back: wrappedBack,
            setContext: wrappedSetContext,
            isRestoring,
          })
        : components,
    [
      components,
      flowState.context,
      flowState.stepId,
      flowState.status,
      flowState.history,
      wrappedNext,
      wrappedBack,
      wrappedSetContext,
      isRestoring,
    ],
  );

  // Build RuntimeFlowDefinition with resolved components
  const flowDefinition = useMemo(
    () => ({
      start: config.start,
      steps: Object.fromEntries(
        Object.entries(config.steps).map(([stepId, stepDef]) => [
          stepId,
          {
            ...stepDef,
            component: resolvedComponents[stepId as StepNames<TConfig>],
          },
        ]),
      ),
    }),
    [config, resolvedComponents],
  ) as RuntimeFlowDefinition<ExtractContext<TConfig>>;

  const flowValue = useMemo(
    () => ({
      ...flowState,
      next: wrappedNext,
      back: wrappedBack,
      setContext: wrappedSetContext,
      save,
      __flow: flowDefinition,
      component: flowDefinition.steps[flowState.stepId]?.component,
      isRestoring,
    }),
    [
      flowState,
      wrappedNext,
      wrappedBack,
      wrappedSetContext,
      save,
      flowDefinition,
      isRestoring,
    ],
  );

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
          migrate: config.migrate,
          instanceId,
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
    instanceId,
    config,
    onPersistenceError,
    onRestore,
    flowState.restore,
    flowDefinitionWithoutComponents,
  ]);

  // Show loading component while restoring to prevent flash of wrong content
  if (isRestoring) {
    return <>{loadingComponent ?? null}</>;
  }

  return (
    <ReactFlowContext.Provider value={flowValue}>
      {children ?? <FlowStep />}
    </ReactFlowContext.Provider>
  );
}

/**
 * FlowStep - renders the current step component
 *
 * Use this component to control where the current step is rendered.
 * If not provided, Flow will render the step automatically.
 *
 * @example
 * ```tsx
 * <Flow flow={myFlow} components={...} initialContext={...}>
 *   <Header />
 *   <FlowStep />
 *   <Footer />
 * </Flow>
 * ```
 */
export function FlowStep() {
  const { component: Component, stepId } = useFlow();

  if (!Component) {
    console.warn(`[FlowStep] No component found for step: ${stepId}`);
    return null;
  }

  return <Component />;
}
