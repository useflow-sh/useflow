import { useFlow } from "@useflow/react";

export function FlowState() {
  const { context, stepId, status, history } = useFlow();

  return (
    <div
      style={{
        position: "fixed",
        top: "1rem",
        right: "1rem",
        padding: "1rem",
        background: "rgba(0, 0, 0, 0.8)",
        color: "white",
        borderRadius: "8px",
        fontSize: "0.875rem",
        width: "400px",
        zIndex: 1000,
        textAlign: "left",
      }}
    >
      <div style={{ marginBottom: "0.5rem", fontWeight: "bold" }}>
        Flow State
      </div>
      <div>
        <strong>Status:</strong> {status}
      </div>
      <div>
        <strong>Step:</strong> {stepId}
      </div>
      <div>
        <strong>History:</strong> {history.join(" → ")}
      </div>
      <div>
        <strong>Context:</strong>
        <pre
          style={{
            margin: "0.25rem 0 0 0",
            fontSize: "0.75rem",
            overflow: "auto",
          }}
        >
          {JSON.stringify(context, null, 2)}
        </pre>
      </div>
    </div>
  );
}
