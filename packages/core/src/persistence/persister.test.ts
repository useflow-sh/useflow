import { describe, expect, it, vi } from "vitest";
import { createPersister } from "./persister";
import type { PersistedFlowState } from "./state";
import type { FlowStorage } from "./storage";

describe("createPersister", () => {
  describe("callbacks", () => {
    it("should call onSave when state is saved", async () => {
      const onSave = vi.fn();
      const storage: FlowStorage = {
        get: vi.fn().mockResolvedValue(null),
        set: vi.fn().mockResolvedValue(undefined),
        remove: vi.fn().mockResolvedValue(undefined),
      };

      const persister = createPersister({ storage, onSave });

      const state: PersistedFlowState = {
        stepId: "profile",
        context: { name: "John" },
        history: ["welcome", "profile"],
        status: "active",
      };

      await persister.save("test-flow", state);

      expect(onSave).toHaveBeenCalledOnce();
      expect(onSave).toHaveBeenCalledWith(
        "test-flow",
        expect.objectContaining({
          stepId: "profile",
          context: { name: "John" },
          history: ["welcome", "profile"],
          status: "active",
          __meta: expect.objectContaining({
            savedAt: expect.any(Number),
          }),
        }),
      );
    });

    it("should call onRestore when state is restored", async () => {
      const onRestore = vi.fn();
      const savedState: PersistedFlowState = {
        stepId: "profile",
        context: { name: "John" },
        history: ["welcome", "profile"],
        status: "active",
        __meta: { savedAt: Date.now(), version: "v1" },
      };

      const storage: FlowStorage = {
        get: vi.fn().mockResolvedValue(savedState),
        set: vi.fn().mockResolvedValue(undefined),
        remove: vi.fn().mockResolvedValue(undefined),
      };

      const persister = createPersister({ storage, onRestore });

      const restored = await persister.restore("test-flow");

      expect(onRestore).toHaveBeenCalledOnce();
      expect(onRestore).toHaveBeenCalledWith("test-flow", savedState);
      expect(restored).toEqual(savedState);
    });

    it("should call onRestore after successful migration", async () => {
      const onRestore = vi.fn();
      const oldState: PersistedFlowState = {
        stepId: "profile",
        context: { email: "john@example.com" },
        history: ["welcome", "profile"],
        status: "active",
        __meta: { version: "v1" },
      };

      const migratedState: PersistedFlowState = {
        stepId: "profile",
        context: { emailAddress: "john@example.com" },
        history: ["welcome", "profile"],
        status: "active",
        __meta: { version: "v2" },
      };

      const storage: FlowStorage = {
        get: vi.fn().mockResolvedValue(oldState),
        set: vi.fn().mockResolvedValue(undefined),
        remove: vi.fn().mockResolvedValue(undefined),
      };

      const migrate = vi.fn().mockReturnValue(migratedState);

      const persister = createPersister({ storage, onRestore });

      const restored = await persister.restore("test-flow", {
        version: "v2",
        migrate,
      });

      expect(onRestore).toHaveBeenCalledOnce();
      expect(onRestore).toHaveBeenCalledWith("test-flow", migratedState);
      expect(restored).toEqual(migratedState);
    });

    it("should not call onRestore if state is null", async () => {
      const onRestore = vi.fn();
      const storage: FlowStorage = {
        get: vi.fn().mockResolvedValue(null),
        set: vi.fn().mockResolvedValue(undefined),
        remove: vi.fn().mockResolvedValue(undefined),
      };

      const persister = createPersister({ storage, onRestore });

      const restored = await persister.restore("test-flow");

      expect(onRestore).not.toHaveBeenCalled();
      expect(restored).toBeNull();
    });

    it("should not call onRestore if validation fails", async () => {
      const onRestore = vi.fn();
      const savedState: PersistedFlowState = {
        stepId: "profile",
        context: { email: "invalid-email" },
        history: ["welcome", "profile"],
        status: "active",
      };

      const storage: FlowStorage = {
        get: vi.fn().mockResolvedValue(savedState),
        set: vi.fn().mockResolvedValue(undefined),
        remove: vi.fn().mockResolvedValue(undefined),
      };

      const validate = vi.fn().mockReturnValue(false);

      const persister = createPersister({ storage, validate, onRestore });

      const restored = await persister.restore("test-flow");

      expect(onRestore).not.toHaveBeenCalled();
      expect(restored).toBeNull();
    });

    it("should not call onRestore if TTL expired", async () => {
      const onRestore = vi.fn();
      const savedState: PersistedFlowState = {
        stepId: "profile",
        context: { name: "John" },
        history: ["welcome", "profile"],
        status: "active",
        __meta: { savedAt: Date.now() - 10000 }, // 10 seconds ago
      };

      const storage: FlowStorage = {
        get: vi.fn().mockResolvedValue(savedState),
        set: vi.fn().mockResolvedValue(undefined),
        remove: vi.fn().mockResolvedValue(undefined),
      };

      const persister = createPersister({
        storage,
        ttl: 5000, // 5 seconds
        onRestore,
      });

      const restored = await persister.restore("test-flow");

      expect(onRestore).not.toHaveBeenCalled();
      expect(restored).toBeNull();
      expect(storage.remove).toHaveBeenCalledWith("test-flow", undefined);
    });

    it("should call onError on save failure", async () => {
      const onError = vi.fn();
      const error = new Error("Storage error");
      const storage: FlowStorage = {
        get: vi.fn().mockResolvedValue(null),
        set: vi.fn().mockRejectedValue(error),
        remove: vi.fn().mockResolvedValue(undefined),
      };

      const persister = createPersister({ storage, onError });

      const state: PersistedFlowState = {
        stepId: "profile",
        context: { name: "John" },
        history: ["welcome", "profile"],
        status: "active",
      };

      await persister.save("test-flow", state);

      expect(onError).toHaveBeenCalledOnce();
      expect(onError).toHaveBeenCalledWith(error);
    });

    it("should call onError on restore failure", async () => {
      const onError = vi.fn();
      const error = new Error("Storage error");
      const storage: FlowStorage = {
        get: vi.fn().mockRejectedValue(error),
        set: vi.fn().mockResolvedValue(undefined),
        remove: vi.fn().mockResolvedValue(undefined),
      };

      const persister = createPersister({ storage, onError });

      const restored = await persister.restore("test-flow");

      expect(onError).toHaveBeenCalledOnce();
      expect(onError).toHaveBeenCalledWith(error);
      expect(restored).toBeNull();
    });

    it("should not call onRestore if migration returns null", async () => {
      const onRestore = vi.fn();
      const oldState: PersistedFlowState = {
        stepId: "profile",
        context: { email: "john@example.com" },
        history: ["welcome", "profile"],
        status: "active",
        __meta: { version: "v1" },
      };

      const storage: FlowStorage = {
        get: vi.fn().mockResolvedValue(oldState),
        set: vi.fn().mockResolvedValue(undefined),
        remove: vi.fn().mockResolvedValue(undefined),
      };

      const migrate = vi.fn().mockReturnValue(null); // Migration fails/returns null

      const persister = createPersister({ storage, onRestore });

      const restored = await persister.restore("test-flow", {
        version: "v2",
        migrate,
      });

      expect(migrate).toHaveBeenCalledWith(oldState, "v1");
      expect(onRestore).not.toHaveBeenCalled();
      expect(restored).toBeNull();
    });

    it("should not call onRestore if version mismatch and no migrate function", async () => {
      const onRestore = vi.fn();
      const oldState: PersistedFlowState = {
        stepId: "profile",
        context: { email: "john@example.com" },
        history: ["welcome", "profile"],
        status: "active",
        __meta: { version: "v1" },
      };

      const storage: FlowStorage = {
        get: vi.fn().mockResolvedValue(oldState),
        set: vi.fn().mockResolvedValue(undefined),
        remove: vi.fn().mockResolvedValue(undefined),
      };

      const persister = createPersister({ storage, onRestore });

      const restored = await persister.restore("test-flow", {
        version: "v2",
        // No migrate function provided
      });

      expect(onRestore).not.toHaveBeenCalled();
      expect(restored).toBeNull();
    });

    it("should call onError on remove failure", async () => {
      const onError = vi.fn();
      const error = new Error("Delete error");
      const storage: FlowStorage = {
        get: vi.fn().mockResolvedValue(null),
        set: vi.fn().mockResolvedValue(undefined),
        remove: vi.fn().mockRejectedValue(error),
      };

      const persister = createPersister({ storage, onError });

      await persister.remove?.("test-flow");

      expect(onError).toHaveBeenCalledOnce();
      expect(onError).toHaveBeenCalledWith(error);
    });

    it("should save with version in saveOptions", async () => {
      const storage: FlowStorage = {
        get: vi.fn().mockResolvedValue(null),
        set: vi.fn().mockResolvedValue(undefined),
        remove: vi.fn().mockResolvedValue(undefined),
      };

      const persister = createPersister({ storage });

      const state: PersistedFlowState = {
        stepId: "profile",
        context: { name: "John" },
        history: ["welcome", "profile"],
        status: "active",
      };

      await persister.save("test-flow", state, { version: "v2" });

      expect(storage.set).toHaveBeenCalledWith(
        "test-flow",
        expect.objectContaining({
          stepId: "profile",
          context: { name: "John" },
          history: ["welcome", "profile"],
          status: "active",
          __meta: expect.objectContaining({
            savedAt: expect.any(Number),
            version: "v2",
          }),
        }),
        undefined, // instanceId
      );
    });

    it("should save without version when saveOptions is undefined", async () => {
      const storage: FlowStorage = {
        get: vi.fn().mockResolvedValue(null),
        set: vi.fn().mockResolvedValue(undefined),
        remove: vi.fn().mockResolvedValue(undefined),
      };

      const persister = createPersister({ storage });

      const state: PersistedFlowState = {
        stepId: "profile",
        context: { name: "John" },
        history: ["welcome", "profile"],
        status: "active",
      };

      await persister.save("test-flow", state);

      expect(storage.set).toHaveBeenCalledWith(
        "test-flow",
        expect.objectContaining({
          stepId: "profile",
          context: { name: "John" },
          history: ["welcome", "profile"],
          status: "active",
          __meta: expect.objectContaining({
            savedAt: expect.any(Number),
            version: undefined,
          }),
        }),
        undefined, // instanceId
      );
    });

    it("should successfully remove state", async () => {
      const removeFn = vi.fn().mockResolvedValue(undefined);
      const storage: FlowStorage = {
        get: vi.fn().mockResolvedValue(null),
        set: vi.fn().mockResolvedValue(undefined),
        remove: removeFn,
      };

      const persister = createPersister({ storage });

      await persister.remove?.("test-flow");

      expect(removeFn).toHaveBeenCalledOnce();
      expect(removeFn).toHaveBeenCalledWith("test-flow", undefined);
    });
  });

  describe("instanceId support", () => {
    it("should save with instanceId", async () => {
      const storage: FlowStorage = {
        get: vi.fn().mockResolvedValue(null),
        set: vi.fn().mockResolvedValue(undefined),
        remove: vi.fn().mockResolvedValue(undefined),
      };

      const persister = createPersister({ storage });

      const state: PersistedFlowState = {
        stepId: "profile",
        context: { name: "John" },
        history: ["welcome", "profile"],
        status: "active",
      };

      await persister.save("test-flow", state, { instanceId: "task-123" });

      expect(storage.set).toHaveBeenCalledWith(
        "test-flow",
        expect.objectContaining({
          stepId: "profile",
          context: { name: "John" },
        }),
        "task-123",
      );
    });

    it("should restore with instanceId", async () => {
      const savedState: PersistedFlowState = {
        stepId: "profile",
        context: { name: "John" },
        history: ["welcome", "profile"],
        status: "active",
      };

      const storage: FlowStorage = {
        get: vi.fn().mockResolvedValue(savedState),
        set: vi.fn().mockResolvedValue(undefined),
        remove: vi.fn().mockResolvedValue(undefined),
      };

      const persister = createPersister({ storage });

      const restored = await persister.restore("test-flow", {
        instanceId: "task-123",
      });

      expect(storage.get).toHaveBeenCalledWith("test-flow", "task-123");
      expect(restored).toEqual(savedState);
    });

    it("should remove with instanceId", async () => {
      const storage: FlowStorage = {
        get: vi.fn().mockResolvedValue(null),
        set: vi.fn().mockResolvedValue(undefined),
        remove: vi.fn().mockResolvedValue(undefined),
      };

      const persister = createPersister({ storage });

      await persister.remove?.("test-flow", "task-123");

      expect(storage.remove).toHaveBeenCalledWith("test-flow", "task-123");
    });

    it("should save with both instanceId and version", async () => {
      const storage: FlowStorage = {
        get: vi.fn().mockResolvedValue(null),
        set: vi.fn().mockResolvedValue(undefined),
        remove: vi.fn().mockResolvedValue(undefined),
      };

      const persister = createPersister({ storage });

      const state: PersistedFlowState = {
        stepId: "profile",
        context: {},
        history: ["profile"],
        status: "active",
      };

      await persister.save("test-flow", state, {
        instanceId: "task-123",
        version: "v2",
      });

      expect(storage.set).toHaveBeenCalledWith(
        "test-flow",
        expect.objectContaining({
          __meta: expect.objectContaining({
            version: "v2",
          }),
        }),
        "task-123",
      );
    });

    it("should remove expired state with instanceId when TTL exceeded", async () => {
      const savedState: PersistedFlowState = {
        stepId: "profile",
        context: { name: "John" },
        history: ["welcome", "profile"],
        status: "active",
        __meta: { savedAt: Date.now() - 10000 }, // 10 seconds ago
      };

      const storage: FlowStorage = {
        get: vi.fn().mockResolvedValue(savedState),
        set: vi.fn().mockResolvedValue(undefined),
        remove: vi.fn().mockResolvedValue(undefined),
      };

      const persister = createPersister({
        storage,
        ttl: 5000, // 5 seconds
      });

      const restored = await persister.restore("test-flow", {
        instanceId: "task-123",
      });

      expect(restored).toBeNull();
      expect(storage.remove).toHaveBeenCalledWith("test-flow", "task-123");
    });
  });

  describe("removeFlow", () => {
    it("should call storage.removeFlow when available", async () => {
      const removeFlow = vi.fn().mockResolvedValue(undefined);
      const storage: FlowStorage = {
        get: vi.fn().mockResolvedValue(null),
        set: vi.fn().mockResolvedValue(undefined),
        remove: vi.fn().mockResolvedValue(undefined),
        removeFlow,
      };

      const persister = createPersister({ storage });

      await persister.removeFlow?.("test-flow");

      expect(removeFlow).toHaveBeenCalledOnce();
      expect(removeFlow).toHaveBeenCalledWith("test-flow");
    });

    it("should call onError on removeFlow failure", async () => {
      const onError = vi.fn();
      const error = new Error("removeFlow failed");
      const removeFlow = vi.fn().mockRejectedValue(error);
      const storage: FlowStorage = {
        get: vi.fn().mockResolvedValue(null),
        set: vi.fn().mockResolvedValue(undefined),
        remove: vi.fn().mockResolvedValue(undefined),
        removeFlow,
      };

      const persister = createPersister({ storage, onError });

      await persister.removeFlow?.("test-flow");

      expect(onError).toHaveBeenCalledOnce();
      expect(onError).toHaveBeenCalledWith(error);
    });

    it("should not have removeFlow if storage does not implement it", () => {
      const storage: FlowStorage = {
        get: vi.fn().mockResolvedValue(null),
        set: vi.fn().mockResolvedValue(undefined),
        remove: vi.fn().mockResolvedValue(undefined),
      };

      const persister = createPersister({ storage });

      expect(persister.removeFlow).toBeUndefined();
    });
  });

  describe("removeAll", () => {
    it("should call storage.removeAll when available", async () => {
      const removeAll = vi.fn().mockResolvedValue(undefined);
      const storage: FlowStorage = {
        get: vi.fn().mockResolvedValue(null),
        set: vi.fn().mockResolvedValue(undefined),
        remove: vi.fn().mockResolvedValue(undefined),
        removeAll,
      };

      const persister = createPersister({ storage });

      await persister.removeAll?.();

      expect(removeAll).toHaveBeenCalledOnce();
    });

    it("should call onError on removeAll failure", async () => {
      const onError = vi.fn();
      const error = new Error("removeAll failed");
      const removeAll = vi.fn().mockRejectedValue(error);
      const storage: FlowStorage = {
        get: vi.fn().mockResolvedValue(null),
        set: vi.fn().mockResolvedValue(undefined),
        remove: vi.fn().mockResolvedValue(undefined),
        removeAll,
      };

      const persister = createPersister({ storage, onError });

      await persister.removeAll?.();

      expect(onError).toHaveBeenCalledOnce();
      expect(onError).toHaveBeenCalledWith(error);
    });

    it("should not have removeAll if storage does not implement it", () => {
      const storage: FlowStorage = {
        get: vi.fn().mockResolvedValue(null),
        set: vi.fn().mockResolvedValue(undefined),
        remove: vi.fn().mockResolvedValue(undefined),
      };

      const persister = createPersister({ storage });

      expect(persister.removeAll).toBeUndefined();
    });
  });
});
