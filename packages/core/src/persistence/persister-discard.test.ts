import { describe, expect, it, vi } from "vitest";
import type { FlowRestoreDiscardReason, PersistedFlowState } from "../index";
import { createPersister } from "./persister";
import { createMemoryStore } from "./stores/memory";

const createState = (
  overrides: Partial<PersistedFlowState> = {},
): PersistedFlowState => ({
  stepId: "welcome",
  context: {},
  startedAt: 1000,
  path: [{ stepId: "welcome", startedAt: 1000 }],
  history: [{ stepId: "welcome", startedAt: 1000 }],
  status: "active",
  __meta: { savedAt: Date.now(), version: "v1" },
  ...overrides,
});

const discardReasons = [
  "expired",
  "version_unmigrated",
  "migration_rejected",
  "validation_rejected",
] satisfies FlowRestoreDiscardReason[];

describe("persister restore discards", () => {
  it.each(discardReasons)("reports %s exactly once", async (reason) => {
    const store = createMemoryStore();
    const onDiscard = vi.fn();
    const onRestore = vi.fn();
    const onError = vi.fn();
    const identifiers = { instanceId: "user-1", variantId: "experiment-a" };
    const state = createState({
      __meta: { savedAt: Date.now() - 5000, version: "v1" },
    });
    store.set("onboarding", state, identifiers);
    const persister = createPersister({
      store,
      onDiscard,
      onRestore,
      onError,
      ttl: reason === "expired" ? 1000 : undefined,
      validate: reason === "validation_rejected" ? () => false : undefined,
    });
    const result = await persister.restore("onboarding", {
      ...identifiers,
      version: reason === "validation_rejected" ? "v1" : "v2",
      migrate: reason === "migration_rejected" ? () => null : undefined,
    });

    expect(result).toBeNull();
    expect(onDiscard).toHaveBeenCalledExactlyOnceWith({
      flowId: "onboarding",
      reason,
      fromVersion: "v1",
      toVersion: reason === "validation_rejected" ? "v1" : "v2",
      ...identifiers,
    });
    expect(onDiscard.mock.calls[0]?.[0]).not.toHaveProperty("errors");
    expect(onRestore).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
    expect(store.get("onboarding", identifiers)).toEqual(
      reason === "expired" ? null : state,
    );
  });

  it("does not report missing state", async () => {
    const onDiscard = vi.fn();
    const persister = createPersister({
      store: createMemoryStore(),
      onDiscard,
    });

    expect(await persister.restore("missing")).toBeNull();
    expect(onDiscard).not.toHaveBeenCalled();
  });

  it.each([false, true])(
    "does not report successful restore (migrated: %s)",
    async (migrated) => {
      const store = createMemoryStore();
      const state = createState();
      store.set("onboarding", state);
      const onDiscard = vi.fn();
      const onRestore = vi.fn();
      const validate = vi.fn().mockReturnValue(true);
      const migration = vi.fn((saved: PersistedFlowState) => ({
        ...saved,
        context: { migrated: true },
      }));
      const persister = createPersister({
        store,
        onDiscard,
        onRestore,
        validate,
      });

      const result = await persister.restore("onboarding", {
        version: migrated ? "v2" : "v1",
        migrate: migration,
      });

      expect(result?.context).toEqual(migrated ? { migrated: true } : {});
      expect(onRestore).toHaveBeenCalledExactlyOnceWith("onboarding", result);
      expect(onDiscard).not.toHaveBeenCalled();
      expect(validate).toHaveBeenCalledTimes(migrated ? 0 : 1);
      expect(migration).toHaveBeenCalledTimes(migrated ? 1 : 0);
    },
  );

  it("allows a restore callback to override the persister callback", async () => {
    const store = createMemoryStore();
    store.set("onboarding", createState());
    const onDiscard = vi.fn();
    const onRestoreDiscard = vi.fn();
    const persister = createPersister({ store, onDiscard });

    await persister.restore("onboarding", {
      version: "v2",
      onDiscard: onRestoreDiscard,
    });

    expect(onRestoreDiscard).toHaveBeenCalledOnce();
    expect(onDiscard).not.toHaveBeenCalled();
  });

  it("supports unknown versions and absent instance identifiers", async () => {
    const store = createMemoryStore();
    store.set("onboarding", createState({ __meta: undefined }));
    const onDiscard = vi.fn();
    const persister = createPersister({
      store,
      validate: () => false,
      onDiscard,
    });

    await persister.restore("onboarding");

    expect(onDiscard).toHaveBeenCalledExactlyOnceWith({
      flowId: "onboarding",
      reason: "validation_rejected",
      fromVersion: undefined,
      toVersion: undefined,
      instanceId: undefined,
      variantId: undefined,
    });
  });

  it.each(discardReasons)(
    "isolates throwing callbacks for %s",
    async (reason) => {
      const store = createMemoryStore();
      const state = createState({
        __meta: { savedAt: Date.now() - 5000, version: "v1" },
      });
      store.set("onboarding", state);
      const failure = new Error("Tracker unavailable");
      const onDiscard = vi.fn(() => {
        throw failure;
      });
      const onError = vi.fn();
      const persister = createPersister({
        store,
        onDiscard,
        onError,
        ttl: reason === "expired" ? 1000 : undefined,
        validate: reason === "validation_rejected" ? () => false : undefined,
      });

      await expect(
        persister.restore("onboarding", {
          version: reason === "validation_rejected" ? "v1" : "v2",
          migrate: reason === "migration_rejected" ? () => null : undefined,
        }),
      ).resolves.toBeNull();
      expect(onDiscard).toHaveBeenCalledOnce();
      expect(onError).toHaveBeenCalledExactlyOnceWith(failure);
      expect(store.get("onboarding")).toEqual(
        reason === "expired" ? null : state,
      );
    },
  );

  it("isolates failures without an error handler", async () => {
    const store = createMemoryStore();
    store.set("onboarding", createState());
    const persister = createPersister({
      store,
      onDiscard: () => {
        throw new Error("Tracker unavailable");
      },
    });

    await expect(
      persister.restore("onboarding", { version: "v2" }),
    ).resolves.toBeNull();
  });

  it("isolates a throwing discard error handler", async () => {
    const store = createMemoryStore();
    store.set("onboarding", createState());
    const persister = createPersister({
      store,
      onDiscard: () => {
        throw new Error("Tracker unavailable");
      },
      onError: () => {
        throw new Error("Reporter unavailable");
      },
    });

    await expect(
      persister.restore("onboarding", { version: "v2" }),
    ).resolves.toBeNull();
  });
});
