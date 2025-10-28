import type { KVFlowStorage, PersistedFlowState } from "@useflow/react";
import { useFlow } from "@useflow/react";
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
  storage,
  instanceId,
}: {
  flowId: string;
  storage: KVFlowStorage;
  instanceId?: string;
}) {
  const { context, stepId, status, history, isRestoring } = useFlow();
  const [showDebug, setShowDebug] = useState(true);
  const [persistedState, setPersistedState] =
    useState<PersistedFlowState | null>(null);

  // Poll storage for updates to persisted state
  useEffect(() => {
    const updatePersistedState = async () => {
      const state = await storage.get(flowId, instanceId);
      setPersistedState(state || null);
    };

    // Initial load
    updatePersistedState();

    // Poll every 500ms to show real-time updates
    const interval = setInterval(updatePersistedState, 500);
    return () => clearInterval(interval);
  }, [flowId, storage, instanceId]);

  const handleClearCurrentFlow = async () => {
    await storage.remove(flowId, instanceId);
    setPersistedState(null);
    window.location.reload();
  };

  const handleClearAllFlows = async () => {
    await storage.removeAll?.();
    setPersistedState(null);
    window.location.reload();
  };

  return (
    <Card className="fixed top-4 right-4 w-96 z-50 text-sm">
      <CardHeader>
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="w-full flex justify-between items-center text-left p-0 bg-transparent border-none cursor-pointer"
        >
          <CardTitle className="text-base">Flow Inspector</CardTitle>
          <span className="text-muted-foreground">{showDebug ? "▼" : "▶"}</span>
        </button>
      </CardHeader>

      {showDebug && (
        <CardContent className="space-y-4">
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
                <strong>History:</strong> {history.join(" → ")}
              </div>
              <div>
                <strong>Context:</strong>
                <pre className="mt-1 text-[0.7rem] overflow-auto bg-muted p-2 rounded max-h-36">
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
            <div className="bg-muted p-2 rounded text-[0.7rem] font-mono max-h-36 overflow-auto">
              {persistedState ? (
                <pre className="m-0 whitespace-pre-wrap">
                  {JSON.stringify(persistedState, null, 2)}
                </pre>
              ) : (
                <span className="text-muted-foreground">No saved state</span>
              )}
            </div>
            <div className="text-[0.65rem] text-muted-foreground">
              Key: <code>{storage.getKey(flowId, instanceId)}</code>
            </div>
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
            <Button
              onClick={handleClearAllFlows}
              variant="destructive"
              size="sm"
              className="w-full"
            >
              Clear All Flows
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
