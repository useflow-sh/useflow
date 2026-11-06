import { describe, expect, it, vi } from "vitest";
import type { FlowState } from "../types";
import { createPersister } from "./persister";
import { JsonSerializer } from "./serializer";
import type { FlowStore } from "./store";
import { kvStorageAdapter } from "./stores/kv-storage-adapter";
import { createMemoryStore } from "./stores/memory";

const state: FlowState = {
  stepId: "welcome",
  context: {},
  startedAt: 1000,
  path: [{ stepId: "welcome", startedAt: 1000 }],
  history: [{ stepId: "welcome", startedAt: 1000 }],
  status: "active",
};

const failingStore = (error: Error): FlowStore => ({
  get: vi.fn().mockRejectedValue(error),
  set: vi.fn().mockRejectedValue(error),
  remove: vi.fn().mockRejectedValue(error),
});

describe("persister error handlers", () => {
  const operations = {
    save: (
      persister: ReturnType<typeof createPersister>,
      onError?: () => void,
    ) => persister.save("onboarding", state, { onError }),
    restore: (
      persister: ReturnType<typeof createPersister>,
      onError?: () => void,
    ) => persister.restore("onboarding", { onError }),
    remove: (
      persister: ReturnType<typeof createPersister>,
      onError?: () => void,
    ) => persister.remove?.("onboarding", { onError }),
  };

  it.each(Object.entries(operations))(
    "%s: a per-call onError replaces the persister onError",
    async (_operation, run) => {
      const error = new Error("Storage unavailable");
      const persisterOnError = vi.fn();
      const callOnError = vi.fn();
      const persister = createPersister({
        store: failingStore(error),
        onError: persisterOnError,
      });

      await run(persister, callOnError);

      expect(callOnError).toHaveBeenCalledExactlyOnceWith(error);
      expect(persisterOnError).not.toHaveBeenCalled();
    },
  );

  it.each(Object.entries(operations))(
    "%s: falls back to the persister onError",
    async (_operation, run) => {
      const error = new Error("Storage unavailable");
      const persisterOnError = vi.fn();
      const persister = createPersister({
        store: failingStore(error),
        onError: persisterOnError,
      });

      await run(persister);

      expect(persisterOnError).toHaveBeenCalledExactlyOnceWith(error);
    },
  );

  it("does not pass the per-call handler to the store", async () => {
    const store = createMemoryStore();
    const remove = vi.spyOn(store, "remove");
    const persister = createPersister({ store });

    await persister.remove?.("onboarding", {
      instanceId: "user-1",
      onError: vi.fn(),
    });

    expect(remove).toHaveBeenCalledWith("onboarding", {
      instanceId: "user-1",
      variantId: undefined,
    });
  });

  it("survives a throwing error handler", async () => {
    const persister = createPersister({
      store: failingStore(new Error("Storage unavailable")),
      onError: () => {
        throw new Error("Reporter unavailable");
      },
    });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    await expect(persister.restore("onboarding")).resolves.toBeNull();
    await expect(persister.save("onboarding", state)).resolves.toBeNull();

    warn.mockRestore();
  });

  it("reports unreadable stored data and restores nothing", async () => {
    const storage = {
      getItem: vi.fn().mockResolvedValue("{not json"),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
    const onError = vi.fn();
    const persister = createPersister({
      store: kvStorageAdapter({
        storage,
        formatKey: (flowId) => `useflow:${flowId}`,
        serializer: JsonSerializer,
      }),
      onError,
    });

    await expect(persister.restore("onboarding")).resolves.toBeNull();

    expect(onError).toHaveBeenCalledExactlyOnceWith(
      new Error(
        'Stored flow state at "useflow:onboarding" could not be deserialized',
      ),
    );
  });
});
