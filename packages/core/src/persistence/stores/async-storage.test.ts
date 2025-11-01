import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PersistedFlowState } from "../../types";
import { createAsyncStorageStore } from "./async-storage";

// Mock AsyncStorage
function createMockAsyncStorage() {
  const store = new Map<string, string>();

  return {
    getItem: vi.fn(async (key: string) => store.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
    removeItem: vi.fn(async (key: string) => {
      store.delete(key);
    }),
    getAllKeys: vi.fn(async () => Array.from(store.keys())),
    clear: vi.fn(async () => {
      store.clear();
    }),
    // Helper for tests
    _store: store,
  };
}

describe("createAsyncStorageStore", () => {
  let mockAsyncStorage: ReturnType<typeof createMockAsyncStorage>;

  beforeEach(() => {
    mockAsyncStorage = createMockAsyncStorage();
  });

  describe("basic operations", () => {
    it("should create a store with default prefix", async () => {
      const store = createAsyncStorageStore(mockAsyncStorage);

      const state: PersistedFlowState = {
        stepId: "step1",
        startedAt: 1234567890,
        context: { name: "test" },
        path: [{ stepId: "step1", startedAt: 1234567890 }],
        history: [{ stepId: "step1", startedAt: 1234567890 }],
        status: "active",
        __meta: { version: "v1", savedAt: Date.now() },
      };

      await store.set("test-flow", state);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        "useflow:test-flow:default:default",
        expect.any(String),
      );
    });

    it("should create a store with custom prefix", async () => {
      const store = createAsyncStorageStore(mockAsyncStorage, {
        prefix: "myapp",
      });

      const state: PersistedFlowState = {
        stepId: "step1",
        startedAt: 1234567890,
        context: { name: "test" },
        path: [{ stepId: "step1", startedAt: 1234567890 }],
        history: [{ stepId: "step1", startedAt: 1234567890 }],
        status: "active",
        __meta: { version: "v1", savedAt: Date.now() },
      };

      await store.set("test-flow", state);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        "myapp:test-flow:default:default",
        expect.any(String),
      );
    });

    it("should get state from storage", async () => {
      const store = createAsyncStorageStore(mockAsyncStorage);

      const state: PersistedFlowState = {
        stepId: "step1",
        startedAt: 1234567890,
        context: { name: "test" },
        path: [{ stepId: "step1", startedAt: 1234567890 }],
        history: [{ stepId: "step1", startedAt: 1234567890 }],
        status: "active",
        __meta: { version: "v1", savedAt: Date.now() },
      };

      await store.set("test-flow", state);
      const result = await store.get("test-flow");

      expect(result).toEqual(state);
    });

    it("should return null for non-existent key", async () => {
      const store = createAsyncStorageStore(mockAsyncStorage);
      const result = await store.get("non-existent");

      expect(result).toBeNull();
    });

    it("should remove state from storage", async () => {
      const store = createAsyncStorageStore(mockAsyncStorage);

      const state: PersistedFlowState = {
        stepId: "step1",
        startedAt: 1234567890,
        context: { name: "test" },
        path: [{ stepId: "step1", startedAt: 1234567890 }],
        history: [{ stepId: "step1", startedAt: 1234567890 }],
        status: "active",
        __meta: { version: "v1", savedAt: Date.now() },
      };

      await store.set("test-flow", state);
      await store.remove("test-flow");

      const result = await store.get("test-flow");
      expect(result).toBeNull();
    });
  });

  describe("instance ID support", () => {
    it("should handle instance IDs in keys", async () => {
      const store = createAsyncStorageStore(mockAsyncStorage, {
        prefix: "myapp",
      });

      const state: PersistedFlowState = {
        stepId: "step1",
        startedAt: 1234567890,
        context: { taskId: "123" },
        path: [{ stepId: "step1", startedAt: 1234567890 }],
        history: [{ stepId: "step1", startedAt: 1234567890 }],
        status: "active",
        __meta: { version: "v1", savedAt: Date.now() },
      };

      await store.set("feedback", state, { instanceId: "task-123" });

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        "myapp:feedback:default:task-123",
        expect.any(String),
      );
    });

    it("should get state with instance ID", async () => {
      const store = createAsyncStorageStore(mockAsyncStorage);

      const state: PersistedFlowState = {
        stepId: "step1",
        startedAt: 1234567890,
        context: { taskId: "123" },
        path: [{ stepId: "step1", startedAt: 1234567890 }],
        history: [{ stepId: "step1", startedAt: 1234567890 }],
        status: "active",
        __meta: { version: "v1", savedAt: Date.now() },
      };

      await store.set("feedback", state, { instanceId: "task-123" });
      const result = await store.get("feedback", { instanceId: "task-123" });

      expect(result).toEqual(state);
    });

    it("should handle explicit undefined variantId and instanceId", async () => {
      const store = createAsyncStorageStore(mockAsyncStorage, {
        prefix: "myapp",
      });

      const state: PersistedFlowState = {
        stepId: "step1",
        startedAt: 1234567890,
        context: {},
        path: [{ stepId: "step1", startedAt: 1234567890 }],
        history: [{ stepId: "step1", startedAt: 1234567890 }],
        status: "active",
        __meta: { version: "v1", savedAt: Date.now() },
      };

      // Explicitly pass undefined to trigger default value assignment
      await store.set("test-flow", state, {
        instanceId: undefined,
        variantId: undefined,
      });
      const result = await store.get("test-flow", {
        instanceId: undefined,
        variantId: undefined,
      });

      expect(result).toEqual(state);
      // Should use default values for key
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        "myapp:test-flow:default:default",
        expect.any(String),
      );
    });

    it("should remove state with instance ID", async () => {
      const store = createAsyncStorageStore(mockAsyncStorage);

      const state: PersistedFlowState = {
        stepId: "step1",
        startedAt: 1234567890,
        context: { taskId: "123" },
        path: [{ stepId: "step1", startedAt: 1234567890 }],
        history: [{ stepId: "step1", startedAt: 1234567890 }],
        status: "active",
        __meta: { version: "v1", savedAt: Date.now() },
      };

      await store.set("feedback", state, { instanceId: "task-123" });
      await store.remove("feedback", { instanceId: "task-123" });

      const result = await store.get("feedback", { instanceId: "task-123" });
      expect(result).toBeNull();
    });
  });

  describe("getAllKeys requirement", () => {
    it("should throw error if getAllKeys is not available", async () => {
      const invalidStorage = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      };

      const store = createAsyncStorageStore(invalidStorage);

      await expect(store.removeAll?.()).rejects.toThrow(
        "AsyncStorage must have a getAllKeys() method",
      );
    });
  });

  describe("removeFlow", () => {
    it("should remove all instances of a flow", async () => {
      const store = createAsyncStorageStore(mockAsyncStorage);

      const state1: PersistedFlowState = {
        stepId: "step1",
        startedAt: 1234567890,
        context: {},
        path: [{ stepId: "step1", startedAt: 1234567890 }],
        history: [{ stepId: "step1", startedAt: 1234567890 }],
        status: "active",
        __meta: { version: "v1", savedAt: Date.now() },
      };

      const state2: PersistedFlowState = {
        stepId: "step2",
        startedAt: 1234567890,
        context: {},
        path: [{ stepId: "step2", startedAt: 1234567890 }],
        history: [{ stepId: "step2", startedAt: 1234567890 }],
        status: "active",
        __meta: { version: "v1", savedAt: Date.now() },
      };

      // Set base flow and instances
      await store.set("feedback", state1);
      await store.set("feedback", state1, { instanceId: "task-1" });
      await store.set("feedback", state2, { instanceId: "task-2" });
      await store.set("onboarding", state1); // Different flow

      // Remove all feedback flows
      await store.removeFlow?.("feedback");

      // Feedback flows should be gone
      expect(await store.get("feedback")).toBeNull();
      expect(await store.get("feedback", { instanceId: "task-1" })).toBeNull();
      expect(await store.get("feedback", { instanceId: "task-2" })).toBeNull();

      // Other flows should remain
      expect(await store.get("onboarding")).toEqual(state1);
    });

    it("should handle flows with custom prefix", async () => {
      const store = createAsyncStorageStore(mockAsyncStorage, {
        prefix: "myapp",
      });

      const state: PersistedFlowState = {
        stepId: "step1",
        startedAt: 1234567890,
        context: {},
        path: [{ stepId: "step1", startedAt: 1234567890 }],
        history: [{ stepId: "step1", startedAt: 1234567890 }],
        status: "active",
        __meta: { version: "v1", savedAt: Date.now() },
      };

      await store.set("flow1", state);
      await store.set("flow1", state, { instanceId: "inst-1" });
      await store.set("flow2", state);

      await store.removeFlow?.("flow1");

      expect(await store.get("flow1")).toBeNull();
      expect(await store.get("flow1", { instanceId: "inst-1" })).toBeNull();
      expect(await store.get("flow2")).toEqual(state);
    });
  });

  describe("removeAll", () => {
    it("should remove all flows with prefix", async () => {
      const store = createAsyncStorageStore(mockAsyncStorage, {
        prefix: "myapp",
      });

      const state: PersistedFlowState = {
        stepId: "step1",
        startedAt: 1234567890,
        context: {},
        path: [{ stepId: "step1", startedAt: 1234567890 }],
        history: [{ stepId: "step1", startedAt: 1234567890 }],
        status: "active",
        __meta: { version: "v1", savedAt: Date.now() },
      };

      await store.set("flow1", state);
      await store.set("flow2", state);
      await store.set("flow3", state, { instanceId: "instance-1" });

      // Add some non-prefixed keys
      await mockAsyncStorage.setItem("other:key", "value");

      await store.removeAll?.();

      // All prefixed flows should be gone
      expect(await store.get("flow1")).toBeNull();
      expect(await store.get("flow2")).toBeNull();
      expect(await store.get("flow3", { instanceId: "instance-1" })).toBeNull();

      // Non-prefixed keys should remain
      expect(await mockAsyncStorage.getItem("other:key")).toBe("value");
    });

    it("should only remove keys with matching prefix", async () => {
      const store = createAsyncStorageStore(mockAsyncStorage, {
        prefix: "app1",
      });

      const state: PersistedFlowState = {
        stepId: "step1",
        startedAt: 1234567890,
        context: {},
        path: [{ stepId: "step1", startedAt: 1234567890 }],
        history: [{ stepId: "step1", startedAt: 1234567890 }],
        status: "active",
        __meta: { version: "v1", savedAt: Date.now() },
      };

      await store.set("flow1", state);

      // Add keys with different prefix
      await mockAsyncStorage.setItem("app2:flow1", "value");
      await mockAsyncStorage.setItem("other:flow1", "value");

      await store.removeAll?.();

      expect(await store.get("flow1")).toBeNull();
      expect(await mockAsyncStorage.getItem("app2:flow1")).toBe("value");
      expect(await mockAsyncStorage.getItem("other:flow1")).toBe("value");
    });
  });

  describe("list", () => {
    it("should list all instances of a flow", async () => {
      const store = createAsyncStorageStore(mockAsyncStorage);

      const state1: PersistedFlowState = {
        stepId: "step1",
        startedAt: 1234567890,
        context: { id: 1 },
        path: [{ stepId: "step1", startedAt: 1234567890 }],
        history: [{ stepId: "step1", startedAt: 1234567890 }],
        status: "active",
        __meta: { version: "v1", savedAt: Date.now() },
      };

      const state1WithInstance1: PersistedFlowState = {
        ...state1,
        __meta: { ...state1.__meta, instanceId: "task-1" },
      };

      const state2: PersistedFlowState = {
        stepId: "step2",
        startedAt: 1234567890,
        context: { id: 2 },
        path: [{ stepId: "step2", startedAt: 1234567890 }],
        history: [{ stepId: "step2", startedAt: 1234567890 }],
        status: "active",
        __meta: { version: "v1", savedAt: Date.now(), instanceId: "task-2" },
      };

      await store.set("feedback", state1);
      await store.set("feedback", state1WithInstance1, {
        instanceId: "task-1",
      });
      await store.set("feedback", state2, { instanceId: "task-2" });

      const instances = await store.list?.("feedback");

      expect(instances).toHaveLength(3);
      expect(instances).toContainEqual({
        flowId: "feedback",
        instanceId: "default",
        variantId: "default",
        state: state1,
      });
      expect(instances).toContainEqual({
        flowId: "feedback",
        instanceId: "task-1",
        variantId: "default",
        state: state1WithInstance1,
      });
      expect(instances).toContainEqual({
        flowId: "feedback",
        instanceId: "task-2",
        variantId: "default",
        state: state2,
      });
    });

    it("should handle empty results", async () => {
      const store = createAsyncStorageStore(mockAsyncStorage);

      const instances = await store.list?.("non-existent");

      expect(instances).toEqual([]);
    });
  });

  describe("custom serializer", () => {
    it("should use custom serializer", async () => {
      const customSerializer = {
        serialize: vi.fn((state: PersistedFlowState) =>
          JSON.stringify({ custom: true, ...state }),
        ),
        deserialize: vi.fn((data: string) => {
          const parsed = JSON.parse(data);
          delete parsed.custom;
          return parsed;
        }),
      };

      const store = createAsyncStorageStore(mockAsyncStorage, {
        serializer: customSerializer,
      });

      const state: PersistedFlowState = {
        stepId: "step1",
        startedAt: 1234567890,
        context: { name: "test" },
        path: [{ stepId: "step1", startedAt: 1234567890 }],
        history: [{ stepId: "step1", startedAt: 1234567890 }],
        status: "active",
        __meta: { version: "v1", savedAt: Date.now() },
      };

      await store.set("test-flow", state);

      expect(customSerializer.serialize).toHaveBeenCalledWith({
        flowId: "test-flow",
        instanceId: "default",
        variantId: "default",
        state,
      });

      const result = await store.get("test-flow");

      expect(customSerializer.deserialize).toHaveBeenCalled();
      expect(result).toEqual(state);
    });
  });

  describe("async operations", () => {
    it("should handle all async operations correctly", async () => {
      const store = createAsyncStorageStore(mockAsyncStorage);

      const state: PersistedFlowState = {
        stepId: "step1",
        startedAt: 1234567890,
        context: { name: "test" },
        path: [{ stepId: "step1", startedAt: 1234567890 }],
        history: [{ stepId: "step1", startedAt: 1234567890 }],
        status: "active",
        __meta: { version: "v1", savedAt: Date.now() },
      };

      // All operations should be awaitable
      await store.set("flow1", state);
      const result = await store.get("flow1");
      expect(result).toEqual(state);

      await store.remove("flow1");
      expect(await store.get("flow1")).toBeNull();
    });

    it("should handle concurrent operations", async () => {
      const store = createAsyncStorageStore(mockAsyncStorage);

      const state1: PersistedFlowState = {
        stepId: "step1",
        startedAt: 1234567890,
        context: { id: 1 },
        path: [{ stepId: "step1", startedAt: 1234567890 }],
        history: [{ stepId: "step1", startedAt: 1234567890 }],
        status: "active",
        __meta: { version: "v1", savedAt: Date.now() },
      };

      const state2: PersistedFlowState = {
        stepId: "step2",
        startedAt: 1234567890,
        context: { id: 2 },
        path: [{ stepId: "step2", startedAt: 1234567890 }],
        history: [{ stepId: "step2", startedAt: 1234567890 }],
        status: "active",
        __meta: { version: "v1", savedAt: Date.now() },
      };

      // Set multiple flows concurrently
      await Promise.all([
        store.set("flow1", state1),
        store.set("flow2", state2),
      ]);

      // Get them concurrently
      const [result1, result2] = await Promise.all([
        store.get("flow1"),
        store.get("flow2"),
      ]);

      expect(result1).toEqual(state1);
      expect(result2).toEqual(state2);
    });
  });

  describe("formatKey method", () => {
    it("should handle undefined variantId and instanceId in formatKey method", () => {
      const store = createAsyncStorageStore(mockAsyncStorage);

      // Access the formatKey method directly with undefined values
      const key1 = store.formatKey("test-flow", {
        variantId: undefined,
        instanceId: undefined,
      });
      expect(key1).toBe("useflow:test-flow:default:default");

      const key2 = store.formatKey("test-flow", { instanceId: "inst-1" });
      expect(key2).toBe("useflow:test-flow:default:inst-1");

      const key3 = store.formatKey("test-flow", { variantId: "v2" });
      expect(key3).toBe("useflow:test-flow:v2:default");
    });
  });
});
