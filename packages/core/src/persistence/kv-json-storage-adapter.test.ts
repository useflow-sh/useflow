import { describe, expect, it, vi } from "vitest";
import type { PersistedFlowState } from "../types";
import { kvJsonStorageAdapter } from "./kv-json-storage-adapter";

// Helper to create a minimal Storage mock
function createStorageMock(overrides: Partial<Storage> = {}): Storage {
  return {
    length: 0,
    clear: vi.fn(),
    key: vi.fn(() => null),
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    ...overrides,
  } as Storage;
}

// Default formatKey function for tests
const defaultFormatKey = (flowId: string, instanceId?: string) =>
  instanceId ? `useflow:${flowId}:${instanceId}` : `useflow:${flowId}`;

// Default listKeys function for tests with mockData
const createListKeys =
  (mockData: Record<string, string>) => (flowId?: string) => {
    const allKeys = Object.keys(mockData);
    if (!flowId) return allKeys;

    const baseKey = defaultFormatKey(flowId);
    return allKeys.filter(
      (key) => key === baseKey || key.startsWith(`${baseKey}:`),
    );
  };

describe("kvJsonStorageAdapter", () => {
  it("should get state from storage", async () => {
    const state: PersistedFlowState = {
      stepId: "step1",
      context: { name: "John" },
      history: ["step1"],
      status: "active",
    };

    const store = createStorageMock({
      getItem: vi.fn().mockResolvedValue(JSON.stringify(state)),
    });

    const storage = kvJsonStorageAdapter({
      store,
      formatKey: defaultFormatKey,
    });

    const result = await storage.get("test-flow");

    expect(result).toEqual(state);
    expect(store.getItem).toHaveBeenCalledWith("useflow:test-flow");
  });

  it("should return null when no state exists", async () => {
    const store = createStorageMock({
      getItem: vi.fn().mockResolvedValue(null),
    });

    const storage = kvJsonStorageAdapter({
      store,
      formatKey: defaultFormatKey,
    });

    const result = await storage.get("test-flow");

    expect(result).toBeNull();
  });

  it("should return null on invalid JSON", async () => {
    const store = createStorageMock({
      getItem: vi.fn().mockResolvedValue("invalid json"),
    });

    const storage = kvJsonStorageAdapter({
      store,
      formatKey: defaultFormatKey,
    });

    const result = await storage.get("test-flow");

    expect(result).toBeNull();
  });

  it("should return null on get error", async () => {
    const store = createStorageMock({
      getItem: vi.fn().mockRejectedValue(new Error("Storage error")),
    });

    const storage = kvJsonStorageAdapter({
      store,
      formatKey: defaultFormatKey,
    });

    const result = await storage.get("test-flow");

    expect(result).toBeNull();
  });

  it("should set state to storage", async () => {
    const state: PersistedFlowState = {
      stepId: "step1",
      context: { name: "John" },
      history: ["step1"],
      status: "active",
    };

    const setItem = vi.fn().mockResolvedValue(undefined);
    const store = createStorageMock({ setItem });

    const storage = kvJsonStorageAdapter({
      store,
      formatKey: defaultFormatKey,
    });

    await storage.set("test-flow", state);

    expect(setItem).toHaveBeenCalledWith(
      "useflow:test-flow",
      JSON.stringify(state),
    );
  });

  it("should remove state from storage", async () => {
    const removeItem = vi.fn().mockResolvedValue(undefined);
    const store = createStorageMock({ removeItem });

    const storage = kvJsonStorageAdapter({
      store,
      formatKey: defaultFormatKey,
    });

    await storage.remove("test-flow");

    expect(removeItem).toHaveBeenCalledWith("useflow:test-flow");
  });

  it("should use custom formatKey function", async () => {
    const state: PersistedFlowState = {
      stepId: "step1",
      context: {},
      history: ["step1"],
      status: "active",
    };

    const getItem = vi.fn().mockResolvedValue(JSON.stringify(state));
    const setItem = vi.fn().mockResolvedValue(undefined);
    const removeItem = vi.fn().mockResolvedValue(undefined);
    const store = createStorageMock({ getItem, setItem, removeItem });

    const formatKey = vi.fn((flowId: string, instanceId?: string) =>
      instanceId
        ? `myapp:user:${flowId}:${instanceId}`
        : `myapp:user:${flowId}`,
    );

    const storage = kvJsonStorageAdapter({ store, formatKey });

    await storage.get("test-flow");
    await storage.set("test-flow", state);
    await storage.remove("test-flow");

    expect(formatKey).toHaveBeenCalledTimes(3);
    expect(formatKey).toHaveBeenCalledWith("test-flow", undefined);
    expect(getItem).toHaveBeenCalledWith("myapp:user:test-flow");
    expect(setItem).toHaveBeenCalledWith(
      "myapp:user:test-flow",
      JSON.stringify(state),
    );
    expect(removeItem).toHaveBeenCalledWith("myapp:user:test-flow");
  });

  it("should work with synchronous storage", async () => {
    const state: PersistedFlowState = {
      stepId: "step1",
      context: {},
      history: ["step1"],
      status: "active",
    };

    const store = createStorageMock({
      getItem: vi.fn().mockReturnValue(JSON.stringify(state)),
    });

    const storage = kvJsonStorageAdapter({
      store,
      formatKey: defaultFormatKey,
    });

    const result = await storage.get("test-flow");

    expect(result).toEqual(state);
  });

  it("should deserialize state with metadata", async () => {
    const state: PersistedFlowState = {
      stepId: "step1",
      context: { name: "John" },
      history: ["step1"],
      status: "active",
      __meta: {
        savedAt: Date.now(),
        version: "v1",
      },
    };

    const store = createStorageMock({
      getItem: vi.fn().mockResolvedValue(JSON.stringify(state)),
    });

    const storage = kvJsonStorageAdapter({
      store,
      formatKey: defaultFormatKey,
    });

    const result = await storage.get("test-flow");

    expect(result).toEqual(state);
    expect(result?.__meta).toEqual({
      savedAt: expect.any(Number),
      version: "v1",
    });
  });

  describe("instanceId support", () => {
    it("should get state with instanceId", async () => {
      const state: PersistedFlowState = {
        stepId: "step1",
        context: {},
        history: ["step1"],
        status: "active",
      };

      const store = createStorageMock({
        getItem: vi.fn().mockResolvedValue(JSON.stringify(state)),
      });

      const storage = kvJsonStorageAdapter({
        store,
        formatKey: defaultFormatKey,
      });

      const result = await storage.get("test-flow", "instance-123");

      expect(result).toEqual(state);
      expect(store.getItem).toHaveBeenCalledWith(
        "useflow:test-flow:instance-123",
      );
    });

    it("should set state with instanceId", async () => {
      const state: PersistedFlowState = {
        stepId: "step1",
        context: {},
        history: ["step1"],
        status: "active",
      };

      const setItem = vi.fn().mockResolvedValue(undefined);
      const store = createStorageMock({ setItem });

      const storage = kvJsonStorageAdapter({
        store,
        formatKey: defaultFormatKey,
      });

      await storage.set("test-flow", state, "instance-123");

      expect(setItem).toHaveBeenCalledWith(
        "useflow:test-flow:instance-123",
        JSON.stringify(state),
      );
    });

    it("should remove state with instanceId", async () => {
      const removeItem = vi.fn().mockResolvedValue(undefined);
      const store = createStorageMock({ removeItem });

      const storage = kvJsonStorageAdapter({
        store,
        formatKey: defaultFormatKey,
      });

      await storage.remove("test-flow", "instance-123");

      expect(removeItem).toHaveBeenCalledWith("useflow:test-flow:instance-123");
    });

    it("should use custom getKey with instanceId", async () => {
      const state: PersistedFlowState = {
        stepId: "step1",
        context: {},
        history: ["step1"],
        status: "active",
      };

      const getItem = vi.fn().mockResolvedValue(JSON.stringify(state));
      const store = createStorageMock({ getItem });

      const formatKey = vi.fn((flowId: string, instanceId?: string) =>
        instanceId ? `custom:${flowId}:${instanceId}` : `custom:${flowId}`,
      );

      const storage = kvJsonStorageAdapter({ store, formatKey });

      await storage.get("test-flow", "task-456");

      expect(formatKey).toHaveBeenCalledWith("test-flow", "task-456");
      expect(getItem).toHaveBeenCalledWith("custom:test-flow:task-456");
    });
  });

  describe("removeFlow", () => {
    it("should remove flow without instanceId", async () => {
      // Create a real object that acts as storage
      const mockData: Record<string, string> = {
        "useflow:test-flow": "{}",
        "useflow:other-flow": "{}",
      };

      const removeItem = vi.fn((key: string) => {
        delete mockData[key];
      });

      // Use mockData as the store, with listKeys to enumerate
      const storage = kvJsonStorageAdapter({
        store: Object.assign(mockData, {
          length: 0,
          clear: vi.fn(),
          key: vi.fn(() => null),
          getItem: vi.fn(() => null),
          setItem: vi.fn(),
          removeItem,
        }) as Storage,
        formatKey: defaultFormatKey,
        listKeys: createListKeys(mockData),
      });

      await storage.removeFlow!("test-flow");

      expect(removeItem).toHaveBeenCalledWith("useflow:test-flow");
      expect(removeItem).not.toHaveBeenCalledWith("useflow:other-flow");
      expect(mockData).not.toHaveProperty("useflow:test-flow");
      expect(mockData).toHaveProperty("useflow:other-flow");
    });

    it("should remove flow with all instances", async () => {
      const mockData: Record<string, string> = {
        "useflow:test-flow": "{}",
        "useflow:test-flow:instance-1": "{}",
        "useflow:test-flow:instance-2": "{}",
        "useflow:other-flow": "{}",
      };

      const removeItem = vi.fn((key: string) => {
        delete mockData[key];
      });

      const storage = kvJsonStorageAdapter({
        store: Object.assign(mockData, {
          length: 0,
          clear: vi.fn(),
          key: vi.fn(() => null),
          getItem: vi.fn(() => null),
          setItem: vi.fn(),
          removeItem,
        }) as Storage,
        formatKey: defaultFormatKey,
        listKeys: createListKeys(mockData),
      });

      await storage.removeFlow!("test-flow");

      expect(removeItem).toHaveBeenCalledWith("useflow:test-flow");
      expect(removeItem).toHaveBeenCalledWith("useflow:test-flow:instance-1");
      expect(removeItem).toHaveBeenCalledWith("useflow:test-flow:instance-2");
      expect(removeItem).not.toHaveBeenCalledWith("useflow:other-flow");
      expect(removeItem).toHaveBeenCalledTimes(3);
    });

    it("should work with custom formatKey in removeFlow", async () => {
      const mockData: Record<string, string> = {
        "user123:test-flow": "{}",
        "user123:test-flow:instance-1": "{}",
        "user456:test-flow": "{}",
      };

      const removeItem = vi.fn((key: string) => {
        delete mockData[key];
      });

      const formatKey = vi.fn((flowId: string, instanceId?: string) =>
        instanceId ? `user123:${flowId}:${instanceId}` : `user123:${flowId}`,
      );

      const storage = kvJsonStorageAdapter({
        store: Object.assign(mockData, {
          length: 0,
          clear: vi.fn(),
          key: vi.fn(() => null),
          getItem: vi.fn(() => null),
          setItem: vi.fn(),
          removeItem,
        }) as Storage,
        formatKey,
        listKeys: (flowId) => {
          const allKeys = Object.keys(mockData);
          if (!flowId) return allKeys;
          const baseKey = formatKey(flowId);
          return allKeys.filter(
            (key) => key === baseKey || key.startsWith(`${baseKey}:`),
          );
        },
      });

      await storage.removeFlow!("test-flow");

      expect(removeItem).toHaveBeenCalledWith("user123:test-flow");
      expect(removeItem).toHaveBeenCalledWith("user123:test-flow:instance-1");
      expect(removeItem).not.toHaveBeenCalledWith("user456:test-flow");
    });
  });

  describe("list", () => {
    it("should list all instances of a flow", async () => {
      const state1: PersistedFlowState = {
        stepId: "step1",
        context: { name: "Task 1" },
        history: ["step1"],
        status: "active",
        __meta: { savedAt: Date.now(), instanceId: "instance-1" },
      };

      const state2: PersistedFlowState = {
        stepId: "step2",
        context: { name: "Task 2" },
        history: ["step1", "step2"],
        status: "active",
        __meta: { savedAt: Date.now(), instanceId: "instance-2" },
      };

      const mockData: Record<string, string> = {
        "useflow:test-flow:instance-1": JSON.stringify(state1),
        "useflow:test-flow:instance-2": JSON.stringify(state2),
        "useflow:other-flow:instance-1": JSON.stringify({
          ...state1,
          __meta: { savedAt: Date.now(), instanceId: "instance-1" },
        }),
      };

      const getItem = vi.fn((key: string) => mockData[key] || null);
      const key = vi.fn(
        (index: number) => Object.keys(mockData)[index] || null,
      );

      const storage = kvJsonStorageAdapter({
        store: Object.assign(mockData, {
          length: Object.keys(mockData).length,
          clear: vi.fn(),
          key,
          getItem,
          setItem: vi.fn(),
          removeItem: vi.fn(),
        }) as Storage,
        formatKey: defaultFormatKey,
        listKeys: createListKeys(mockData),
      });

      const instances = await storage.list!("test-flow");

      expect(instances).toHaveLength(2);
      expect(instances).toEqual([
        { instanceId: "instance-1", state: state1 },
        { instanceId: "instance-2", state: state2 },
      ]);
    });

    it("should return empty array when no instances exist", async () => {
      const mockData: Record<string, string> = {
        "useflow:other-flow:instance-1": "{}",
      };

      const getItem = vi.fn((key: string) => mockData[key] || null);
      const key = vi.fn(
        (index: number) => Object.keys(mockData)[index] || null,
      );

      const storage = kvJsonStorageAdapter({
        store: Object.assign(mockData, {
          length: Object.keys(mockData).length,
          clear: vi.fn(),
          key,
          getItem,
          setItem: vi.fn(),
          removeItem: vi.fn(),
        }) as Storage,
        formatKey: defaultFormatKey,
        listKeys: createListKeys(mockData),
      });

      const instances = await storage.list!("test-flow");

      expect(instances).toEqual([]);
    });

    it("should skip invalid entries", async () => {
      const state: PersistedFlowState = {
        stepId: "step1",
        context: {},
        history: ["step1"],
        status: "active",
      };

      const mockData: Record<string, string> = {
        "useflow:test-flow:instance-1": JSON.stringify({
          ...state,
          __meta: { savedAt: Date.now(), instanceId: "instance-1" },
        }),
        "useflow:test-flow:instance-2": "invalid json",
        "useflow:test-flow:instance-3": JSON.stringify({
          ...state,
          __meta: { savedAt: Date.now(), instanceId: "instance-3" },
        }),
      };

      const getItem = vi.fn((key: string) => mockData[key] || null);
      const key = vi.fn(
        (index: number) => Object.keys(mockData)[index] || null,
      );

      const storage = kvJsonStorageAdapter({
        store: Object.assign(mockData, {
          length: Object.keys(mockData).length,
          clear: vi.fn(),
          key,
          getItem,
          setItem: vi.fn(),
          removeItem: vi.fn(),
        }) as Storage,
        formatKey: defaultFormatKey,
        listKeys: createListKeys(mockData),
      });

      const instances = await storage.list!("test-flow");

      expect(instances).toHaveLength(2);
      expect(instances).toEqual([
        {
          instanceId: "instance-1",
          state: expect.objectContaining({
            ...state,
            __meta: expect.objectContaining({ instanceId: "instance-1" }),
          }),
        },
        {
          instanceId: "instance-3",
          state: expect.objectContaining({
            ...state,
            __meta: expect.objectContaining({ instanceId: "instance-3" }),
          }),
        },
      ]);
    });

    it("should skip entries that fail deserialization", async () => {
      const state: PersistedFlowState = {
        stepId: "step1",
        context: {},
        history: ["step1"],
        status: "active",
      };

      const mockData: Record<string, string> = {
        "useflow:test-flow:instance-1": JSON.stringify({
          ...state,
          __meta: { savedAt: Date.now(), instanceId: "instance-1" },
        }),
        "useflow:test-flow:instance-2": JSON.stringify({
          invalid: "structure",
        }), // Valid JSON but invalid state structure
        "useflow:test-flow:instance-3": JSON.stringify({
          ...state,
          __meta: { savedAt: Date.now(), instanceId: "instance-3" },
        }),
      };

      const getItem = vi.fn((key: string) => mockData[key] || null);
      const key = vi.fn(
        (index: number) => Object.keys(mockData)[index] || null,
      );

      const storage = kvJsonStorageAdapter({
        store: Object.assign(mockData, {
          length: Object.keys(mockData).length,
          clear: vi.fn(),
          key,
          getItem,
          setItem: vi.fn(),
          removeItem: vi.fn(),
        }) as Storage,
        formatKey: defaultFormatKey,
        listKeys: createListKeys(mockData),
      });

      const instances = await storage.list!("test-flow");

      expect(instances).toHaveLength(2);
      expect(instances).toEqual([
        {
          instanceId: "instance-1",
          state: expect.objectContaining({
            ...state,
            __meta: expect.objectContaining({ instanceId: "instance-1" }),
          }),
        },
        {
          instanceId: "instance-3",
          state: expect.objectContaining({
            ...state,
            __meta: expect.objectContaining({ instanceId: "instance-3" }),
          }),
        },
      ]);
    });

    it("should skip entries when getItem throws an error", async () => {
      const state: PersistedFlowState = {
        stepId: "step1",
        context: {},
        history: ["step1"],
        status: "active",
      };

      const mockData: Record<string, string> = {
        "useflow:test-flow:instance-1": JSON.stringify({
          ...state,
          __meta: { savedAt: Date.now(), instanceId: "instance-1" },
        }),
        "useflow:test-flow:instance-2": JSON.stringify({
          ...state,
          __meta: { savedAt: Date.now(), instanceId: "instance-2" },
        }),
        "useflow:test-flow:instance-3": JSON.stringify({
          ...state,
          __meta: { savedAt: Date.now(), instanceId: "instance-3" },
        }),
      };

      const getItem = vi.fn((key: string) => {
        // Throw error for instance-2 to trigger the catch block
        if (key === "useflow:test-flow:instance-2") {
          throw new Error("Storage read error");
        }
        return mockData[key] || null;
      });

      const key = vi.fn(
        (index: number) => Object.keys(mockData)[index] || null,
      );

      const storage = kvJsonStorageAdapter({
        store: Object.assign(mockData, {
          length: Object.keys(mockData).length,
          clear: vi.fn(),
          key,
          getItem,
          setItem: vi.fn(),
          removeItem: vi.fn(),
        }) as Storage,
        formatKey: defaultFormatKey,
        listKeys: createListKeys(mockData),
      });

      const instances = await storage.list!("test-flow");

      // Should skip instance-2 due to error and return only instance-1 and instance-3
      expect(instances).toHaveLength(2);
      expect(instances).toEqual([
        {
          instanceId: "instance-1",
          state: expect.objectContaining({
            ...state,
            __meta: expect.objectContaining({ instanceId: "instance-1" }),
          }),
        },
        {
          instanceId: "instance-3",
          state: expect.objectContaining({
            ...state,
            __meta: expect.objectContaining({ instanceId: "instance-3" }),
          }),
        },
      ]);
    });

    it("should work with custom getKey function", async () => {
      const state: PersistedFlowState = {
        stepId: "step1",
        context: {},
        history: ["step1"],
        status: "active",
      };

      const mockData: Record<string, string> = {
        "myapp:user123:test-flow:instance-1": JSON.stringify({
          ...state,
          __meta: { savedAt: Date.now(), instanceId: "instance-1" },
        }),
        "myapp:user123:test-flow:instance-2": JSON.stringify({
          ...state,
          __meta: { savedAt: Date.now(), instanceId: "instance-2" },
        }),
        "myapp:user456:test-flow:instance-1": JSON.stringify({
          ...state,
          __meta: { savedAt: Date.now(), instanceId: "instance-1" },
        }),
      };

      const getItem = vi.fn((key: string) => mockData[key] || null);
      const key = vi.fn(
        (index: number) => Object.keys(mockData)[index] || null,
      );

      const formatKey = vi.fn((flowId: string, instanceId?: string) =>
        instanceId
          ? `myapp:user123:${flowId}:${instanceId}`
          : `myapp:user123:${flowId}`,
      );

      const storage = kvJsonStorageAdapter({
        store: Object.assign(mockData, {
          length: Object.keys(mockData).length,
          clear: vi.fn(),
          key,
          getItem,
          setItem: vi.fn(),
          removeItem: vi.fn(),
        }) as Storage,
        formatKey,
        listKeys: (flowId) => {
          const allKeys = Object.keys(mockData);
          if (!flowId) return allKeys;
          const baseKey = formatKey(flowId);
          return allKeys.filter(
            (key) => key === baseKey || key.startsWith(`${baseKey}:`),
          );
        },
      });

      const instances = await storage.list!("test-flow");

      expect(instances).toHaveLength(2);
      expect(
        instances.every((i) => i.instanceId?.startsWith("instance-")),
      ).toBe(true);
    });

    it("should include base flow key with undefined instanceId", async () => {
      const state: PersistedFlowState = {
        stepId: "step1",
        context: {},
        history: ["step1"],
        status: "active",
      };

      const mockData: Record<string, string> = {
        "useflow:test-flow": JSON.stringify(state), // Base key - should be included
        "useflow:test-flow:instance-1": JSON.stringify({
          ...state,
          __meta: { savedAt: Date.now(), instanceId: "instance-1" },
        }),
        "useflow:test-flow:instance-2": JSON.stringify({
          ...state,
          __meta: { savedAt: Date.now(), instanceId: "instance-2" },
        }),
      };

      const getItem = vi.fn((key: string) => mockData[key] || null);
      const key = vi.fn(
        (index: number) => Object.keys(mockData)[index] || null,
      );

      const storage = kvJsonStorageAdapter({
        store: Object.assign(mockData, {
          length: Object.keys(mockData).length,
          clear: vi.fn(),
          key,
          getItem,
          setItem: vi.fn(),
          removeItem: vi.fn(),
        }) as Storage,
        formatKey: defaultFormatKey,
        listKeys: createListKeys(mockData),
      });

      const instances = await storage.list!("test-flow");

      expect(instances).toHaveLength(3);
      expect(instances).toEqual([
        { instanceId: undefined, state }, // Base instance with undefined
        {
          instanceId: "instance-1",
          state: expect.objectContaining({
            ...state,
            __meta: expect.objectContaining({ instanceId: "instance-1" }),
          }),
        },
        {
          instanceId: "instance-2",
          state: expect.objectContaining({
            ...state,
            __meta: expect.objectContaining({ instanceId: "instance-2" }),
          }),
        },
      ]);
    });
  });

  describe("removeAll", () => {
    it("should remove all flows returned by listKeys", async () => {
      const mockData: Record<string, string> = {
        "useflow:flow1": "{}",
        "useflow:flow2": "{}",
        "useflow:flow2:instance-1": "{}",
        "other:key": "{}",
      };

      const removeItem = vi.fn((key: string) => {
        delete mockData[key];
      });

      const storage = kvJsonStorageAdapter({
        store: Object.assign(mockData, {
          length: 0,
          clear: vi.fn(),
          key: vi.fn(() => null),
          getItem: vi.fn(() => null),
          setItem: vi.fn(),
          removeItem,
        }) as Storage,
        formatKey: defaultFormatKey,
        listKeys: () =>
          Object.keys(mockData).filter((key) => key.startsWith("useflow:")),
      });

      await storage.removeAll!();

      expect(removeItem).toHaveBeenCalledWith("useflow:flow1");
      expect(removeItem).toHaveBeenCalledWith("useflow:flow2");
      expect(removeItem).toHaveBeenCalledWith("useflow:flow2:instance-1");
      expect(removeItem).not.toHaveBeenCalledWith("other:key");
      expect(removeItem).toHaveBeenCalledTimes(3);
    });

    it("should remove all flows with custom key format", async () => {
      const mockData: Record<string, string> = {
        "myapp:flow1": "{}",
        "myapp:flow2": "{}",
        "useflow:flow3": "{}",
      };

      const removeItem = vi.fn((key: string) => {
        delete mockData[key];
      });

      const storage = kvJsonStorageAdapter({
        store: Object.assign(mockData, {
          length: 0,
          clear: vi.fn(),
          key: vi.fn(() => null),
          getItem: vi.fn(() => null),
          setItem: vi.fn(),
          removeItem,
        }) as Storage,
        formatKey: (flowId, instanceId) =>
          instanceId ? `myapp:${flowId}:${instanceId}` : `myapp:${flowId}`,
        listKeys: () =>
          Object.keys(mockData).filter((key) => key.startsWith("myapp:")),
      });

      await storage.removeAll!();

      expect(removeItem).toHaveBeenCalledWith("myapp:flow1");
      expect(removeItem).toHaveBeenCalledWith("myapp:flow2");
      expect(removeItem).not.toHaveBeenCalledWith("useflow:flow3");
    });

    it("should only remove keys returned by listKeys", async () => {
      const mockData: Record<string, string> = {
        "useflow:flow1": "{}",
        "useflow2:flow1": "{}",
        "myuseflow:flow1": "{}",
      };

      const removeItem = vi.fn((key: string) => {
        delete mockData[key];
      });

      const storage = kvJsonStorageAdapter({
        store: Object.assign(mockData, {
          length: 0,
          clear: vi.fn(),
          key: vi.fn(() => null),
          getItem: vi.fn(() => null),
          setItem: vi.fn(),
          removeItem,
        }) as Storage,
        formatKey: defaultFormatKey,
        listKeys: () =>
          Object.keys(mockData).filter((key) => key.startsWith("useflow:")),
      });

      await storage.removeAll!();

      expect(removeItem).toHaveBeenCalledWith("useflow:flow1");
      expect(removeItem).not.toHaveBeenCalledWith("useflow2:flow1");
      expect(removeItem).not.toHaveBeenCalledWith("myuseflow:flow1");
      expect(removeItem).toHaveBeenCalledTimes(1);
    });

    it("should be a no-op when listKeys is not provided", async () => {
      const removeItem = vi.fn();

      const storage = kvJsonStorageAdapter({
        store: {
          length: 0,
          clear: vi.fn(),
          key: vi.fn(() => null),
          getItem: vi.fn(() => null),
          setItem: vi.fn(),
          removeItem,
        } as Storage,
        formatKey: defaultFormatKey,
        // No listKeys provided
      });

      await storage.removeAll!();

      expect(removeItem).not.toHaveBeenCalled();
    });
  });

  describe("removeFlow", () => {
    it("should be a no-op when listKeys is not provided", async () => {
      const removeItem = vi.fn();

      const storage = kvJsonStorageAdapter({
        store: {
          length: 0,
          clear: vi.fn(),
          key: vi.fn(() => null),
          getItem: vi.fn(() => null),
          setItem: vi.fn(),
          removeItem,
        } as Storage,
        formatKey: defaultFormatKey,
        // No listKeys provided
      });

      await storage.removeFlow!("test-flow");

      expect(removeItem).not.toHaveBeenCalled();
    });
  });

  describe("list with edge cases", () => {
    it("should return empty array when listKeys is not provided", async () => {
      const storage = kvJsonStorageAdapter({
        store: {
          length: 0,
          clear: vi.fn(),
          key: vi.fn(() => null),
          getItem: vi.fn(() => null),
          setItem: vi.fn(),
          removeItem: vi.fn(),
        } as Storage,
        formatKey: defaultFormatKey,
        // No listKeys provided
      });

      const instances = await storage.list!("test-flow");

      expect(instances).toEqual([]);
    });

    it("should skip entries where getItem returns null", async () => {
      const state: PersistedFlowState = {
        stepId: "step1",
        context: {},
        history: ["step1"],
        status: "active",
        __meta: { savedAt: Date.now(), instanceId: "instance-1" },
      };

      const mockData: Record<string, string> = {
        "useflow:test-flow:instance-1": JSON.stringify(state),
        "useflow:test-flow:instance-2": "", // Will result in getItem returning null
      };

      const getItem = vi.fn((key: string) => {
        // Return null for instance-2
        if (key === "useflow:test-flow:instance-2") {
          return null;
        }
        return mockData[key] || null;
      });

      const storage = kvJsonStorageAdapter({
        store: {
          length: 0,
          clear: vi.fn(),
          key: vi.fn(() => null),
          getItem,
          setItem: vi.fn(),
          removeItem: vi.fn(),
        } as Storage,
        formatKey: defaultFormatKey,
        listKeys: () => Object.keys(mockData),
      });

      const instances = await storage.list!("test-flow");

      expect(instances).toHaveLength(1);
      expect(instances[0]?.instanceId).toBe("instance-1");
    });
  });
});
