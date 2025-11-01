import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PersistedFlowState } from "../../types";
import {
  createLocalStorageStore,
  createSessionStorageStore,
} from "./browser-storage";

// Mock Web Storage API
function createMockStorage() {
  const store = new Map<string, string>();

  const mockStorage = {
    length: 0,
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value);
      mockStorage.length = store.size;
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
      mockStorage.length = store.size;
    }),
    key: vi.fn((index: number) => {
      const keys = Array.from(store.keys());
      return keys[index] ?? null;
    }),
    clear: vi.fn(() => {
      store.clear();
      mockStorage.length = 0;
    }),
  };

  return mockStorage;
}

describe("createLocalStorageStore", () => {
  let mockStorage: ReturnType<typeof createMockStorage>;

  beforeEach(() => {
    mockStorage = createMockStorage();
  });

  describe("basic operations", () => {
    it("should create a store with default prefix", async () => {
      const store = createLocalStorageStore(mockStorage);

      const state: PersistedFlowState = {
        stepId: "step1",
        context: { name: "test" },
        path: [{ stepId: "step1", startedAt: 1234567890 }],
        history: [{ stepId: "step1", startedAt: 1234567890 }],
        status: "active",
        __meta: { version: "v1", savedAt: Date.now() },
      };

      await store.set("test-flow", state);

      expect(mockStorage.setItem).toHaveBeenCalledWith(
        "useflow:test-flow:default:default",
        expect.any(String),
      );
    });

    it("should create a store with custom prefix", async () => {
      const store = createLocalStorageStore(mockStorage, {
        prefix: "myapp",
      });

      const state: PersistedFlowState = {
        stepId: "step1",
        context: { name: "test" },
        path: [{ stepId: "step1", startedAt: 1234567890 }],
        history: [{ stepId: "step1", startedAt: 1234567890 }],
        status: "active",
        __meta: { version: "v1", savedAt: Date.now() },
      };

      await store.set("test-flow", state);

      expect(mockStorage.setItem).toHaveBeenCalledWith(
        "myapp:test-flow:default:default",
        expect.any(String),
      );
    });

    it("should get state from storage", async () => {
      const store = createLocalStorageStore(mockStorage);

      const state: PersistedFlowState = {
        stepId: "step1",
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
      const store = createLocalStorageStore(mockStorage);
      const result = await store.get("non-existent");

      expect(result).toBeNull();
    });

    it("should remove state from storage", async () => {
      const store = createLocalStorageStore(mockStorage);

      const state: PersistedFlowState = {
        stepId: "step1",
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
      const store = createLocalStorageStore(mockStorage, {
        prefix: "myapp",
      });

      const state: PersistedFlowState = {
        stepId: "step1",
        context: { taskId: "123" },
        path: [{ stepId: "step1", startedAt: 1234567890 }],
        history: [{ stepId: "step1", startedAt: 1234567890 }],
        status: "active",
        __meta: { version: "v1", savedAt: Date.now() },
      };

      await store.set("feedback", state, { instanceId: "task-123" });

      expect(mockStorage.setItem).toHaveBeenCalledWith(
        "myapp:feedback:default:task-123",
        expect.any(String),
      );
    });

    it("should get state with instance ID", async () => {
      const store = createLocalStorageStore(mockStorage);

      const state: PersistedFlowState = {
        stepId: "step1",
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
      const store = createLocalStorageStore(mockStorage);

      const state: PersistedFlowState = {
        stepId: "step1",
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
      expect(mockStorage.getItem).toHaveBeenCalledWith(
        "useflow:test-flow:default:default",
      );
    });

    it("should remove state with instance ID", async () => {
      const store = createLocalStorageStore(mockStorage);

      const state: PersistedFlowState = {
        stepId: "step1",
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

  describe("removeFlow", () => {
    it("should remove all instances of a flow", async () => {
      const store = createLocalStorageStore(mockStorage);

      const state1: PersistedFlowState = {
        stepId: "step1",
        context: {},
        path: [{ stepId: "step1", startedAt: 1234567890 }],
        history: [{ stepId: "step1", startedAt: 1234567890 }],
        status: "active",
        __meta: { version: "v1", savedAt: Date.now() },
      };

      const state2: PersistedFlowState = {
        stepId: "step1",
        context: {},
        path: [{ stepId: "step1", startedAt: 1234567890 }],
        history: [{ stepId: "step1", startedAt: 1234567890 }],
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
  });

  describe("removeAll", () => {
    it("should remove all flows with prefix", async () => {
      const store = createLocalStorageStore(mockStorage, {
        prefix: "myapp",
      });

      const state: PersistedFlowState = {
        stepId: "step1",
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
      mockStorage.setItem("other:key", "value");

      await store.removeAll?.();

      // All prefixed flows should be gone
      expect(await store.get("flow1")).toBeNull();
      expect(await store.get("flow2")).toBeNull();
      expect(await store.get("flow3", { instanceId: "instance-1" })).toBeNull();

      // Non-prefixed keys should remain
      expect(mockStorage.getItem("other:key")).toBe("value");
    });
  });

  describe("list", () => {
    it("should list all instances of a flow", async () => {
      const store = createLocalStorageStore(mockStorage);

      const state1: PersistedFlowState = {
        stepId: "step1",
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
        context: { id: 2 },
        path: [{ stepId: "step2", startedAt: 1234567890 }],
        history: [{ stepId: "step1", startedAt: 1234567890 }],
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

      const store = createLocalStorageStore(mockStorage, {
        serializer: customSerializer,
      });

      const state: PersistedFlowState = {
        stepId: "step1",
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
});

describe("createSessionStorageStore", () => {
  let mockStorage: ReturnType<typeof createMockStorage>;

  beforeEach(() => {
    mockStorage = createMockStorage();
  });

  it("should work the same as localStorage", async () => {
    const store = createSessionStorageStore(mockStorage, {
      prefix: "session",
    });

    const state: PersistedFlowState = {
      stepId: "step1",
      context: { name: "test" },
      path: [{ stepId: "step1", startedAt: 1234567890 }],
      history: [{ stepId: "step1", startedAt: 1234567890 }],
      status: "active",
      __meta: { version: "v1", savedAt: Date.now() },
    };

    await store.set("test-flow", state);

    expect(mockStorage.setItem).toHaveBeenCalledWith(
      "session:test-flow:default:default",
      expect.any(String),
    );

    const result = await store.get("test-flow");
    expect(result).toEqual(state);
  });

  it("should support all the same operations", async () => {
    const store = createSessionStorageStore(mockStorage);

    const state: PersistedFlowState = {
      stepId: "step1",
      context: {},
      path: [{ stepId: "step1", startedAt: 1234567890 }],
      history: [{ stepId: "step1", startedAt: 1234567890 }],
      status: "active",
      __meta: { version: "v1", savedAt: Date.now() },
    };

    // Basic operations
    await store.set("flow1", state);
    expect(await store.get("flow1")).toEqual(state);

    // Instance IDs
    await store.set("flow2", state, { instanceId: "inst-1" });
    expect(await store.get("flow2", { instanceId: "inst-1" })).toEqual(state);

    // Explicit undefined should use defaults
    await store.set("flow4", state, {
      instanceId: undefined,
      variantId: undefined,
    });
    expect(
      await store.get("flow4", {
        instanceId: undefined,
        variantId: undefined,
      }),
    ).toEqual(state);

    // Remove
    await store.remove("flow1");
    expect(await store.get("flow1")).toBeNull();

    // RemoveFlow
    await store.set("flow3", state);
    await store.set("flow3", state, { instanceId: "inst-1" });
    await store.removeFlow?.("flow3");
    expect(await store.get("flow3")).toBeNull();
    expect(await store.get("flow3", { instanceId: "inst-1" })).toBeNull();
  });

  it("should use default prefix when not specified", async () => {
    const store = createSessionStorageStore(mockStorage);

    const state: PersistedFlowState = {
      stepId: "step1",
      context: {},
      path: [{ stepId: "step1", startedAt: 1234567890 }],
      history: [{ stepId: "step1", startedAt: 1234567890 }],
      status: "active",
      __meta: { savedAt: Date.now() },
    };

    await store.set("test-flow", state);

    expect(mockStorage.setItem).toHaveBeenCalledWith(
      "useflow:test-flow:default:default",
      expect.any(String),
    );
  });

  it("should removeAll flows", async () => {
    const store = createSessionStorageStore(mockStorage);

    const state: PersistedFlowState = {
      stepId: "step1",
      context: {},
      path: [{ stepId: "step1", startedAt: 1234567890 }],
      history: [{ stepId: "step1", startedAt: 1234567890 }],
      status: "active",
      __meta: { savedAt: Date.now() },
    };

    await store.set("flow1", state);
    await store.set("flow2", state);

    expect(mockStorage.length).toBe(2);

    await store.removeAll?.();

    expect(mockStorage.length).toBe(0);
  });

  describe("formatKey method", () => {
    it("should handle undefined variantId and instanceId in formatKey method for localStorage", () => {
      const store = createLocalStorageStore(mockStorage, { prefix: "test" });

      // Access the formatKey method directly with undefined values
      const key1 = store.formatKey("test-flow", {
        variantId: undefined,
        instanceId: undefined,
      });
      expect(key1).toBe("test:test-flow:default:default");

      const key2 = store.formatKey("test-flow", { instanceId: "inst-1" });
      expect(key2).toBe("test:test-flow:default:inst-1");

      const key3 = store.formatKey("test-flow", { variantId: "v2" });
      expect(key3).toBe("test:test-flow:v2:default");
    });

    it("should handle undefined variantId and instanceId in formatKey method for sessionStorage", () => {
      const store = createSessionStorageStore(mockStorage, { prefix: "test" });

      // Access the formatKey method directly with undefined values
      const key1 = store.formatKey("test-flow", {
        variantId: undefined,
        instanceId: undefined,
      });
      expect(key1).toBe("test:test-flow:default:default");

      const key2 = store.formatKey("test-flow", { instanceId: "inst-1" });
      expect(key2).toBe("test:test-flow:default:inst-1");

      const key3 = store.formatKey("test-flow", { variantId: "v2" });
      expect(key3).toBe("test:test-flow:v2:default");
    });
  });
});
