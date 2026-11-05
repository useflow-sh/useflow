import { render, screen, waitFor } from "@testing-library/react";
import type {
  FlowRestoreDiscardReason,
  PersistedFlowState,
} from "@useflow/core";
import {
  createMemoryStore,
  createPersister,
  validatePersistedState,
} from "@useflow/core";
import { describe, expect, it, vi } from "vitest";
import { defineFlow } from "./define-flow";
import { Flow } from "./flow";
import { FlowProvider } from "./provider";

const definition = {
  id: "onboarding",
  version: "v2",
  variantId: "experiment-a",
  start: "welcome",
  steps: {
    welcome: { next: "profile" },
    profile: {},
  },
} as const;
const flow = defineFlow(definition);
const identifiers = { instanceId: "user-1", variantId: definition.variantId };
const createState = (
  overrides: Partial<PersistedFlowState> = {},
): PersistedFlowState => ({
  stepId: "profile",
  context: {},
  startedAt: 1000,
  path: [
    { stepId: "welcome", startedAt: 1000 },
    { stepId: "profile", startedAt: 2000 },
  ],
  history: [{ stepId: "welcome", startedAt: 1000 }],
  status: "complete",
  __meta: { savedAt: Date.now(), version: "v2" },
  ...overrides,
});
const discardReasons = [
  "expired",
  "version_unmigrated",
  "migration_rejected",
  "validation_rejected",
  "incompatible_state",
] satisfies FlowRestoreDiscardReason[];

describe("Flow restore discards", () => {
  it.each(["v1", undefined])(
    "reports the original version after an incompatible migration from %s",
    async (fromVersion) => {
      const store = createMemoryStore();
      store.set(flow.id, createState({ __meta: { version: fromVersion } }), {
        variantId: definition.variantId,
      });
      const migratedFlow = flow.with(() => ({
        migration: (state) => ({
          ...state,
          stepId: "removed",
          __meta: { version: "v2" },
        }),
      }));
      const onDiscard = vi.fn();
      const persister = createPersister({ store });

      render(
        <Flow
          flow={migratedFlow}
          persister={persister}
          saveMode="manual"
          onDiscard={onDiscard}
        >
          {({ stepId }) => <div>{stepId}</div>}
        </Flow>,
      );

      await waitFor(() =>
        expect(screen.getByText("welcome")).toBeInTheDocument(),
      );
      expect(onDiscard).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          reason: "incompatible_state",
          fromVersion,
          toVersion: "v2",
        }),
      );
    },
  );

  it.each(discardReasons)(
    "reports %s once through the Flow prop",
    async (reason) => {
      const store = createMemoryStore();
      const state = createState({
        stepId: reason === "incompatible_state" ? "removed" : "profile",
        __meta: {
          savedAt: Date.now() - 5000,
          version:
            reason === "validation_rejected" || reason === "incompatible_state"
              ? "v2"
              : "v1",
        },
      });
      store.set(flow.id, state, identifiers);
      const onDiscard = vi.fn();
      const globalOnDiscard = vi.fn();
      const persisterOnDiscard = vi.fn();
      const onPersistenceError = vi.fn();
      const onRestore = vi.fn();
      const persister = createPersister({
        store,
        onDiscard: persisterOnDiscard,
        ttl: reason === "expired" ? 1000 : undefined,
        validate: reason === "validation_rejected" ? () => false : undefined,
      });
      const selectedFlow =
        reason === "migration_rejected"
          ? flow.with(() => ({ migration: () => null }))
          : flow;

      render(
        <FlowProvider config={{ persister, onDiscard: globalOnDiscard }}>
          <Flow
            flow={selectedFlow}
            instanceId={identifiers.instanceId}
            saveMode="manual"
            onDiscard={onDiscard}
            onRestore={onRestore}
            onPersistenceError={onPersistenceError}
          >
            {({ stepId }) => <div>{stepId}</div>}
          </Flow>
        </FlowProvider>,
      );

      await waitFor(() =>
        expect(screen.getByText("welcome")).toBeInTheDocument(),
      );
      expect(onDiscard).toHaveBeenCalledExactlyOnceWith({
        flowId: flow.id,
        reason,
        fromVersion: state.__meta?.version,
        toVersion: definition.version,
        ...identifiers,
        ...(reason === "incompatible_state"
          ? {
              errors: validatePersistedState(state, definition).errors,
            }
          : {}),
      });
      expect(globalOnDiscard).not.toHaveBeenCalled();
      expect(persisterOnDiscard).not.toHaveBeenCalled();
      expect(onRestore).not.toHaveBeenCalled();
      if (reason === "incompatible_state") {
        expect(onPersistenceError).toHaveBeenCalledExactlyOnceWith(
          new Error(
            `Invalid persisted state: ${validatePersistedState(state, definition).errors?.join(", ")}`,
          ),
        );
      } else {
        expect(onPersistenceError).not.toHaveBeenCalled();
      }
      expect(store.get(flow.id, identifiers)).toEqual(
        reason === "expired" ? null : state,
      );
    },
  );

  it.each(["validation_rejected", "incompatible_state"])(
    "uses the provider callback for %s",
    async (reason) => {
      const store = createMemoryStore();
      store.set(
        flow.id,
        createState({
          stepId: reason === "incompatible_state" ? "removed" : "profile",
        }),
        { variantId: definition.variantId },
      );
      const onDiscard = vi.fn();
      const persisterOnDiscard = vi.fn();
      const persister = createPersister({
        store,
        onDiscard: persisterOnDiscard,
        validate: reason === "validation_rejected" ? () => false : undefined,
      });

      render(
        <FlowProvider config={{ persister, onDiscard, saveMode: "manual" }}>
          <Flow flow={flow}>{({ stepId }) => <div>{stepId}</div>}</Flow>
        </FlowProvider>,
      );

      await waitFor(() =>
        expect(screen.getByText("welcome")).toBeInTheDocument(),
      );
      expect(onDiscard).toHaveBeenCalledOnce();
      expect(onDiscard).toHaveBeenCalledWith(
        expect.objectContaining({ reason }),
      );
      expect(persisterOnDiscard).not.toHaveBeenCalled();
    },
  );

  it("keeps the persister callback when no React callback is set", async () => {
    const store = createMemoryStore();
    store.set(flow.id, createState({ __meta: { version: "v1" } }), {
      variantId: definition.variantId,
    });
    const onDiscard = vi.fn();
    const persister = createPersister({ store, onDiscard });

    render(
      <Flow flow={flow} persister={persister} saveMode="manual">
        {({ stepId }) => <div>{stepId}</div>}
      </Flow>,
    );

    await waitFor(() =>
      expect(screen.getByText("welcome")).toBeInTheDocument(),
    );
    expect(onDiscard).toHaveBeenCalledOnce();
  });

  it.each([false, true])(
    "does not report missing or restored state (stored: %s)",
    async (stored) => {
      const store = createMemoryStore();
      if (stored)
        store.set(flow.id, createState(), { variantId: definition.variantId });
      const onDiscard = vi.fn();
      const onRestore = vi.fn();
      const persister = createPersister({ store });

      render(
        <Flow
          flow={flow}
          persister={persister}
          saveMode="manual"
          onDiscard={onDiscard}
          onRestore={onRestore}
        >
          {({ stepId }) => <div>{stepId}</div>}
        </Flow>,
      );

      await waitFor(() =>
        expect(
          screen.getByText(stored ? "profile" : "welcome"),
        ).toBeInTheDocument(),
      );
      expect(onDiscard).not.toHaveBeenCalled();
      expect(onRestore).toHaveBeenCalledTimes(stored ? 1 : 0);
    },
  );

  it.each(discardReasons)(
    "isolates a throwing Flow callback for %s",
    async (reason) => {
      const store = createMemoryStore();
      store.set(
        flow.id,
        createState({
          stepId: reason === "incompatible_state" ? "removed" : "profile",
          __meta: {
            savedAt: Date.now() - 5000,
            version:
              reason === "validation_rejected" ||
              reason === "incompatible_state"
                ? "v2"
                : "v1",
          },
        }),
        { variantId: definition.variantId },
      );
      const failure = new Error("Tracker unavailable");
      const onDiscard = vi.fn(() => {
        throw failure;
      });
      const onPersistenceError = vi.fn();
      const persisterOnError = vi.fn();
      const persister = createPersister({
        store,
        onError: persisterOnError,
        ttl: reason === "expired" ? 1000 : undefined,
        validate: reason === "validation_rejected" ? () => false : undefined,
      });
      const selectedFlow =
        reason === "migration_rejected"
          ? flow.with(() => ({ migration: () => null }))
          : flow;

      render(
        <Flow
          flow={selectedFlow}
          persister={persister}
          saveMode="manual"
          onDiscard={onDiscard}
          onPersistenceError={onPersistenceError}
        >
          {({ stepId }) => <div>{stepId}</div>}
        </Flow>,
      );

      await waitFor(() =>
        expect(screen.getByText("welcome")).toBeInTheDocument(),
      );
      expect(onDiscard).toHaveBeenCalledOnce();
      expect(onPersistenceError).toHaveBeenCalledWith(failure);
      expect(onPersistenceError).toHaveBeenCalledTimes(
        reason === "incompatible_state" ? 2 : 1,
      );
      expect(persisterOnError).not.toHaveBeenCalled();
    },
  );

  it("isolates a throwing Flow callback without a persistence error handler", async () => {
    const store = createMemoryStore();
    store.set(flow.id, createState({ stepId: "removed" }), {
      variantId: definition.variantId,
    });
    const onDiscard = vi.fn(() => {
      throw new Error("Tracker unavailable");
    });
    const persister = createPersister({ store });

    render(
      <Flow
        flow={flow}
        persister={persister}
        saveMode="manual"
        onDiscard={onDiscard}
      >
        {({ stepId }) => <div>{stepId}</div>}
      </Flow>,
    );

    await waitFor(() =>
      expect(screen.getByText("welcome")).toBeInTheDocument(),
    );
    expect(onDiscard).toHaveBeenCalledOnce();
  });
});
