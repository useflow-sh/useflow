import type { ContextUpdate, FlowContext } from "@useflow/core";
import {
  type ComponentType,
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
 *   const { context, next, back } = useFlow();
 *   // ...
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
  // biome-ignore lint/suspicious/noExplicitAny: Components can accept arbitrary props defined by users
}) => Record<StepNames<TConfig>, ComponentType<any>>;

// biome-ignore lint/suspicious/noExplicitAny: Generic constraint allows any context type
type FlowProps<TConfig extends FlowConfig<any>> = {
  flow: FlowDefinition<TConfig>;
  components: ComponentsFunction<TConfig>;
  initialContext: ExtractContext<TConfig>;
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
  children?: ReactNode;
};

/**
 * Flow - main component for running a flow
 *
 * By default, renders the current step automatically if no children provided.
 * Use FlowStep component for custom layout control.
 *
 * @param flow - FlowDefinition returned by defineFlow() (not raw config)
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
  onComplete,
  onNext,
  onBack,
  onTransition,
  onContextUpdate,
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

    previousStateRef.current = flowState;
  }, [flowState, onNext, onBack, onTransition, onContextUpdate]);

  // Handle completion
  useEffect(() => {
    if (flowState.status === "complete") {
      onComplete?.();
    }
  }, [flowState.status, onComplete]);

  // Resolve components as a function with flow state
  const resolvedComponents = components({
    context: flowState.context,
    stepId: flowState.stepId as StepNames<TConfig>,
    status: flowState.status,
    history: flowState.history,
    next: wrappedNext,
    back: wrappedBack,
    setContext: wrappedSetContext,
  });

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
      __flow: flowDefinition,
    }),
    [flowState, wrappedNext, wrappedBack, wrappedSetContext, flowDefinition],
  );

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
  const { __flow, stepId } = useFlow();
  const currentStep = __flow.steps[stepId];
  const Component = currentStep?.component;

  if (!Component) {
    console.warn(`[FlowStep] No component found for step: ${stepId}`);
    return null;
  }

  return <Component />;
}
