import type { FlowStorage, PersistedFlowState } from "@useflow/react";
import { useFlow } from "@useflow/react";
import { useEffect, useState } from "react";

export function FlowInspector({
  flowId,
  storage,
}: {
  flowId: string;
  storage: FlowStorage;
}) {
  const { context, stepId, status, history, isRestoring } = useFlow();
  const [showDebug, setShowDebug] = useState(true);
  const [persistedState, setPersistedState] =
    useState<PersistedFlowState | null>(null);

  // Poll storage for updates to persisted state
  useEffect(() => {
    const updatePersistedState = async () => {
      const state = await storage.get(flowId);
      setPersistedState(state || null);
    };

    // Initial load
    updatePersistedState();

    // Poll every 500ms to show real-time updates
    const interval = setInterval(updatePersistedState, 500);
    return () => clearInterval(interval);
  }, [flowId, storage]);

  const handleClearCurrentFlow = async () => {
    await storage.remove(flowId);
    setPersistedState(null);
    window.location.reload();
  };

  const handleClearAllFlows = async () => {
    await storage.removeAll?.();
    setPersistedState(null);
    window.location.reload();
  };

  return (
    <div
      style={{
        position: "fixed",
        top: "1rem",
        right: "1rem",
        background: "rgba(0, 0, 0, 0.8)",
        color: "white",
        borderRadius: "8px",
        fontSize: "0.875rem",
        width: "400px",
        zIndex: 1000,
        textAlign: "left",
      }}
    >
      <button
        onClick={() => setShowDebug(!showDebug)}
        style={{
          width: "100%",
          background: "transparent",
          border: "none",
          color: "white",
          padding: "1rem",
          cursor: "pointer",
          fontWeight: "bold",
          textAlign: "left",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "0.875rem",
        }}
      >
        <span>🔍 Flow Inspector</span>
        <span>{showDebug ? "▼" : "▶"}</span>
      </button>

      {showDebug && (
        <div style={{ padding: "0 1rem 1rem 1rem" }}>
          {/* Current Flow State */}
          <div style={{ marginBottom: "1rem" }}>
            <div
              style={{
                fontSize: "1.25rem",
                marginBottom: "0.5rem",
                fontWeight: "bold",
                opacity: 0.7,
              }}
            >
              Current Flow State
            </div>
            <div style={{ marginBottom: "0.25rem" }}>
              <strong>Status:</strong> {status}
            </div>
            <div style={{ marginBottom: "0.25rem" }}>
              <strong>Restoring:</strong> {isRestoring ? "Yes" : "No"}
            </div>
            <div style={{ marginBottom: "0.25rem" }}>
              <strong>Step:</strong> {stepId}
            </div>
            <div style={{ marginBottom: "0.5rem" }}>
              <strong>History:</strong> {history.join(" → ")}
            </div>
            <div>
              <strong>Context:</strong>
              <pre
                style={{
                  margin: "0.25rem 0 0 0",
                  fontSize: "0.75rem",
                  overflow: "auto",
                  background: "rgba(255, 255, 255, 0.05)",
                  padding: "0.5rem",
                  borderRadius: "4px",
                  maxHeight: "150px",
                }}
              >
                {JSON.stringify(context, null, 2)}
              </pre>
            </div>
          </div>

          {/* Persisted State */}
          <div style={{ marginBottom: "1rem" }}>
            <div
              style={{
                fontWeight: "bold",
                marginBottom: "0.5rem",
                opacity: 0.7,
              }}
            >
              Persisted State:
            </div>
            <div
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                padding: "0.5rem",
                borderRadius: "4px",
                fontSize: "0.75rem",
                fontFamily: "monospace",
                maxHeight: "150px",
                overflow: "auto",
              }}
            >
              {persistedState ? (
                <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                  {JSON.stringify(persistedState, null, 2)}
                </pre>
              ) : (
                <span style={{ opacity: 0.6 }}>No saved state</span>
              )}
            </div>
            <div
              style={{
                marginTop: "0.25rem",
                fontSize: "0.7rem",
                opacity: 0.5,
              }}
            >
              Key: <code>myapp:{flowId}</code>
            </div>
          </div>

          {/* Clear Buttons */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
          >
            <button
              onClick={handleClearCurrentFlow}
              disabled={!persistedState}
              style={{
                background: persistedState ? "#ff6b6b" : "#444",
                border: "none",
                color: "white",
                padding: "0.5rem 1rem",
                borderRadius: "4px",
                cursor: persistedState ? "pointer" : "not-allowed",
                opacity: persistedState ? 1 : 0.5,
                fontSize: "0.875rem",
              }}
            >
              🗑️ Clear Current Flow
            </button>
            <button
              onClick={handleClearAllFlows}
              style={{
                background: "#ff6b6b",
                border: "none",
                color: "white",
                padding: "0.5rem 1rem",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "0.875rem",
              }}
            >
              🗑️ Clear All Flows
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
