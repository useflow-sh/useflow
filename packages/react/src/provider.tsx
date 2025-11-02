import type { FlowContext, FlowPersister } from "@useflow/core";
import { createContext, type ReactNode, useContext } from "react";

export type SaveMode = "always" | "navigation" | "manual";

/**
 * Event passed to global transition callbacks
 */
export interface TransitionEvent {
  flowId: string;
  variantId?: string;
  instanceId?: string;
  from: string;
  to: string;
  direction: "forward" | "backward";
  oldContext: FlowContext;
  newContext: FlowContext;
}

/**
 * Configuration for the FlowProvider
 *
 * Provides default settings for all flows in your application.
 * Individual Flow components can override these defaults by passing props directly.
 */
export interface FlowProviderConfig {
  /**
   * Default persister for all flows
   * Can be overridden per-flow by passing persister prop to Flow component
   */
  persister?: FlowPersister;

  /**
   * Default save mode for all flows
   * - "always": Save on every state change (context updates, navigation)
   * - "navigation": Save only on navigation (next/skip/back)
   * - "manual": Only save when calling save() explicitly
   *
   * @default "navigation"
   */
  saveMode?: SaveMode;

  /**
   * Default debounce delay (in ms) for save operations
   * Prevents excessive writes when state changes rapidly
   *
   * @default 300
   */
  saveDebounce?: number;

  /**
   * Global error handler for persistence failures
   * Called when save/restore/remove operations fail
   */
  onPersistenceError?: (error: Error) => void;

  /**
   * Global callbacks for flow lifecycle events
   */
  callbacks?: {
    /**
     * Called when any flow starts (first render with initial state)
     */
    onFlowStart?: (event: {
      flowId: string;
      variantId?: string;
      instanceId?: string;
      context: FlowContext;
    }) => void;

    /**
     * Called when any flow completes
     */
    onFlowComplete?: (event: {
      flowId: string;
      variantId?: string;
      instanceId?: string;
      context: FlowContext;
    }) => void;

    /**
     * Called on every step transition in any flow
     */
    onStepTransition?: (event: TransitionEvent) => void;
  };
}

const FlowConfigContext = createContext<FlowProviderConfig | null>(null);

/**
 * Provider component for global flow configuration
 *
 * Wrap your app with this component to provide default settings for all flows.
 * Individual Flow components can override these defaults by passing props directly.
 *
 * @example
 * ```tsx
 * import { FlowProvider } from '@useflow/react';
 * import { persister } from './lib/storage';
 *
 * function App() {
 *   return (
 *     <FlowProvider config={{
 *       persister,
 *       saveMode: 'always',
 *       saveDebounce: 500,
 *       onPersistenceError: (error) => {
 *         console.error('Flow persistence error:', error);
 *         toast.error('Failed to save progress');
 *       },
 *       callbacks: {
 *         onFlowComplete: (flowId, context) => {
 *           analytics.track('flow_completed', { flowId, context });
 *         }
 *       }
 *     }}>
 *       <YourApp />
 *     </FlowProvider>
 *   );
 * }
 * ```
 */
export function FlowProvider({
  children,
  config,
}: {
  children: ReactNode;
  config: FlowProviderConfig;
}) {
  return (
    <FlowConfigContext.Provider value={config}>
      {children}
    </FlowConfigContext.Provider>
  );
}

/**
 * Hook to access global flow configuration
 *
 * Use this in custom components or hooks to access the global flow config.
 * Returns null if no FlowProvider is present in the component tree.
 *
 * @example
 * ```tsx
 * function CustomFlowComponent() {
 *   const globalConfig = useFlowConfig();
 *   const persister = globalConfig?.persister;
 *
 *   // Use persister...
 * }
 * ```
 */
export function useFlowConfig(): FlowProviderConfig | null {
  return useContext(FlowConfigContext);
}
