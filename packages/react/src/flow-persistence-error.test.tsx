import { render, screen, waitFor } from "@testing-library/react";
import type { FlowStore, PersistedFlowState } from "@useflow/core";
import { createMemoryStore, createPersister } from "@useflow/core";
import { describe, expect, it, vi } from "vitest";
import { defineFlow } from "./define-flow";
import { Flow } from "./flow";
import { FlowProvider } from "./provider";

const flow = defineFlow({
  id: "onboarding",
  variantId: "experiment-a",
  start: "welcome",
  steps: {
    welcome: { next: "profile" },
    profile: {},
  },
});
const instanceId = "user-1";
const failingStore = (overrides: Partial<FlowStore>): FlowStore => ({
  ...createMemoryStore(),
  ...overrides,
});

describe("Flow persistence errors", () => {
  it("receives store failures the persister catches, with context", async () => {
    const error = new Error("Storage unavailable");
    const persisterOnError = vi.fn();
    const onPersistenceError = vi.fn();
    const persister = createPersister({
      store: failingStore({ get: vi.fn().mockRejectedValue(error) }),
      onError: persisterOnError,
    });

    render(
      <FlowProvider config={{ persister, onPersistenceError }}>
        <Flow flow={flow} instanceId={instanceId} saveMode="manual">
          {({ stepId }) => <div>{stepId}</div>}
        </Flow>
      </FlowProvider>,
    );

    await waitFor(() =>
      expect(onPersistenceError).toHaveBeenCalledExactlyOnceWith(error, {
        flowId: "onboarding",
        operation: "restore",
        instanceId,
        variantId: "experiment-a",
      }),
    );
    expect(persisterOnError).not.toHaveBeenCalled();
  });

  it("reports save failures with the save operation", async () => {
    const error = new Error("Quota exceeded");
    const onPersistenceError = vi.fn();
    const persister = createPersister({
      store: failingStore({ set: vi.fn().mockRejectedValue(error) }),
    });

    render(
      <Flow
        flow={flow}
        persister={persister}
        saveMode="always"
        saveDebounce={0}
        onPersistenceError={onPersistenceError}
      >
        {({ stepId, next }) => (
          <button type="button" onClick={() => next()}>
            {stepId}
          </button>
        )}
      </Flow>,
    );

    (await screen.findByText("welcome")).click();

    await waitFor(() =>
      expect(onPersistenceError).toHaveBeenCalledWith(error, {
        flowId: "onboarding",
        operation: "save",
        instanceId: undefined,
        variantId: "experiment-a",
      }),
    );
  });

  it("leaves the persister onError in charge without a Flow handler", async () => {
    const error = new Error("Storage unavailable");
    const persisterOnError = vi.fn();
    const persister = createPersister({
      store: failingStore({ get: vi.fn().mockRejectedValue(error) }),
      onError: persisterOnError,
    });

    render(
      <Flow flow={flow} persister={persister} saveMode="manual">
        {({ stepId }) => <div>{stepId}</div>}
      </Flow>,
    );

    await waitFor(() =>
      expect(persisterOnError).toHaveBeenCalledExactlyOnceWith(error),
    );
  });

  it("reports incompatible state through onPersistenceError when no onDiscard is set", async () => {
    const store = createMemoryStore();
    const saved: PersistedFlowState = {
      stepId: "removed",
      context: {},
      startedAt: 1000,
      path: [{ stepId: "removed", startedAt: 1000 }],
      history: [{ stepId: "removed", startedAt: 1000 }],
      status: "active",
      __meta: { savedAt: Date.now() },
    };
    store.set(flow.id, saved, { variantId: "experiment-a" });
    const onPersistenceError = vi.fn();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    render(
      <Flow
        flow={flow}
        persister={createPersister({ store })}
        saveMode="manual"
        onPersistenceError={onPersistenceError}
      >
        {({ stepId }) => <div>{stepId}</div>}
      </Flow>,
    );

    await screen.findByText("welcome");
    expect(onPersistenceError).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        message: expect.stringContaining("Invalid persisted state"),
      }),
      expect.objectContaining({ flowId: "onboarding", operation: "restore" }),
    );
    warn.mockRestore();
  });

  it("still accepts a one-argument handler", () => {
    const handler = (error: Error) => error.message;
    render(
      <FlowProvider config={{ onPersistenceError: handler }}>
        <Flow flow={flow}>{({ stepId }) => <div>{stepId}</div>}</Flow>
      </FlowProvider>,
    );
  });
});
