import type {
  FlowStore,
  KVFlowStore,
  PersistedFlowState,
} from "@useflow/react";
import { useFlow, useFlowConfig } from "@useflow/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function FlowInspector({
  flowId,
  store: storeProp,
  instanceId,
  variantId,
  position = "right",
}: {
  flowId: string;
  store?: FlowStore;
  instanceId?: string;
  variantId?: string;
  position?: "left" | "right";
}) {
  // Get store from global config if not provided as prop
  const globalConfig = useFlowConfig();
  const store = storeProp ?? globalConfig?.persister?.store;
  const {
    context,
    stepId,
    status,
    path,
    history,
    isRestoring,
    startedAt,
    completedAt,
  } = useFlow();
  // Default to closed on mobile, open on desktop
  const [showDebug, setShowDebug] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 768; // 768px is 'md' breakpoint
    }
    return true;
  });
  const [persistedState, setPersistedState] =
    useState<PersistedFlowState | null>(null);
  const [, setTick] = useState(0);

  // Update showDebug when window resizes
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && showDebug) {
        setShowDebug(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [showDebug]);

  // Update elapsed time every second when flow is active
  useEffect(() => {
    if (status === "active") {
      const interval = setInterval(() => setTick((t) => t + 1), 1000);
      return () => clearInterval(interval);
    }
  }, [status]);

  // Poll storage for updates to persisted state
  useEffect(() => {
    if (!store) return;

    const updatePersistedState = async () => {
      const state = await store.get(flowId, { instanceId, variantId });
      setPersistedState(state || null);
    };

    // Initial load
    updatePersistedState();

    // Poll every 500ms to show real-time updates
    const interval = setInterval(updatePersistedState, 500);
    return () => clearInterval(interval);
  }, [flowId, store, instanceId, variantId]);

  const handleClearCurrentFlow = async () => {
    if (!store) return;
    await store.remove(flowId, { instanceId, variantId });
    setPersistedState(null);
    window.location.reload();
  };

  const positionClass =
    position === "right"
      ? "bottom-4 right-4 sm:right-4"
      : "bottom-4 left-4 sm:left-4";

  return (
    <Card
      className={`fixed ${positionClass} z-40 text-sm bg-card/80 backdrop-blur-sm shadow-lg transition-all duration-300 flex flex-col-reverse border-border/40 ${
        showDebug
          ? "min-w-[300px] max-w-[calc(100vw-2rem)] sm:max-w-md"
          : "w-[180px]"
      }`}
    >
      {/* Header Button - at bottom */}
      <CardHeader className="py-1.5 px-3 sm:px-4">
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="w-full flex justify-between items-center text-left p-0 bg-transparent border-none cursor-pointer hover:opacity-80 transition-opacity"
        >
          <CardTitle className="text-sm">🔍 Flow Inspector</CardTitle>
          <span
            className="text-muted-foreground transition-transform duration-300 text-xs"
            style={{ transform: showDebug ? "rotate(0deg)" : "rotate(180deg)" }}
          >
            ▲
          </span>
        </button>
      </CardHeader>

      {/* Content Drawer - expands above header */}
      <div
        className={`transition-all duration-300 ease-in-out flex flex-col overflow-hidden ${
          showDebug
            ? "max-h-[calc(100vh-8rem)] opacity-100"
            : "max-h-0 opacity-0"
        }`}
      >
        <CardContent className="space-y-4 pb-2 p-3 sm:p-6 overflow-y-auto flex-1">
          {/* Current Flow State */}
          <div className="space-y-2">
            <CardDescription className="font-semibold text-xs uppercase tracking-wide">
              Current Flow State
            </CardDescription>
            <div className="space-y-1 text-xs">
              <div>
                <strong>Status:</strong> {status}
              </div>
              <div>
                <strong>Restoring:</strong> {isRestoring ? "Yes" : "No"}
              </div>
              <div>
                <strong>Step:</strong> {stepId}
              </div>
              <div>
                <strong>Started:</strong>{" "}
                {new Date(startedAt).toLocaleTimeString()}
              </div>
              {completedAt && (
                <div>
                  <strong>Completed:</strong>{" "}
                  {new Date(completedAt).toLocaleTimeString()}
                </div>
              )}
              {completedAt && (
                <div>
                  <strong>Duration:</strong>{" "}
                  {((completedAt - startedAt) / 1000).toFixed(2)}s
                </div>
              )}
              <div>
                <strong>Path:</strong>{" "}
                {path.length > 0
                  ? path.map((e) => e.stepId).join(" → ")
                  : "(empty)"}
              </div>
              <div>
                <strong>History:</strong>
                <pre className="mt-1 text-[0.7rem] overflow-auto bg-muted p-2 rounded max-h-24">
                  {JSON.stringify(history, null, 2)}
                </pre>
              </div>
              <div>
                <strong>Context:</strong>
                <pre className="mt-1 text-[0.7rem] overflow-auto bg-muted p-2 rounded max-h-48">
                  {JSON.stringify(context, null, 2)}
                </pre>
              </div>
            </div>
          </div>

          {/* Persisted State */}
          <div className="space-y-2">
            <CardDescription className="font-semibold text-xs uppercase tracking-wide">
              Persisted State
            </CardDescription>
            <div className="bg-muted p-2 rounded text-[0.7rem] font-mono max-h-48 overflow-auto">
              {persistedState ? (
                <pre className="m-0 whitespace-pre-wrap">
                  {JSON.stringify(persistedState, null, 2)}
                </pre>
              ) : (
                <span className="text-muted-foreground">No saved state</span>
              )}
            </div>
            {store &&
              "formatKey" in store &&
              typeof store.formatKey === "function" && (
                <div className="text-[0.65rem] text-muted-foreground">
                  Key:{" "}
                  <code>
                    {(store as KVFlowStore).formatKey(flowId, {
                      instanceId,
                      variantId,
                    })}
                  </code>
                </div>
              )}
            {(instanceId || variantId) && (
              <div className="text-[0.65rem] text-muted-foreground space-y-0.5">
                {variantId && (
                  <div>
                    <strong>Variant:</strong> {variantId}
                  </div>
                )}
                {instanceId && (
                  <div>
                    <strong>Instance:</strong> {instanceId}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Clear Buttons */}
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleClearCurrentFlow}
              disabled={!persistedState}
              variant="destructive"
              size="sm"
              className="w-full"
            >
              Clear Current Flow
            </Button>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
