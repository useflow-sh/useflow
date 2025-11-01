import { describe, expect, it, vi } from "vitest";
import type { PersistedFlowState } from "../../types";
import { JsonSerializer } from "../serializer";
import { kvStorageAdapter } from "./kv-storage-adapter";

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
const defaultFormatKey = (
  flowId: string,
  instanceId?: string,
  variantId?: string,
) => {
  const vid = variantId || "default";
  const iid = instanceId || "default";
  return `useflow:${flowId}:${vid}:${iid}`;
};

// Default serializer for tests
const defaultSerializer = JsonSerializer;

// Default listKeys function for tests with mockData
const createListKeys =
  (mockData: Record<string, string>) => (flowId?: string) => {
    const allKeys = Object.keys(mockData);
    if (!flowId) return allKeys;

    // Match keys that start with "useflow:flowId:"
    const prefix = `useflow:${flowId}:`;
    return allKeys.filter((key) => key.startsWith(prefix));
  };

describe("kvStorageAdapter", () => {
  it("should get state from storage", async () => {
    const state: PersistedFlowState = {
      stepId: "step1",
      context: { name: "John" },
      history: ["step1"],
      status: "active",
    };

    const instance = {
      flowId: "test-flow",
      instanceId: "default",
      variantId: "default",
      state,
    };

    const storage = createStorageMock({
      getItem: vi.fn().mockResolvedValue(JSON.stringify(instance)),
    });

    const store = kvStorageAdapter({
      storage,
      formatKey: defaultFormatKey,
      serializer: defaultSerializer,
    });

    const result = await store.get("test-flow");

    expect(result).toEqual(state);
    expect(storage.getItem).toHaveBeenCalledWith(
      "useflow:test-flow:default:default",
    );
  });

  it("should return null when no state exists", async () => {
    const storage = createStorageMock({
      getItem: vi.fn().mockResolvedValue(null),
    });

    const store = kvStorageAdapter({
      storage,
      formatKey: defaultFormatKey,
      serializer: defaultSerializer,
    });

    const result = await store.get("test-flow");

    expect(result).toBeNull();
  });

  it("should return null on invalid JSON", async () => {
    const storage = createStorageMock({
      getItem: vi.fn().mockResolvedValue("invalid json"),
    });

    const store = kvStorageAdapter({
      storage,
      formatKey: defaultFormatKey,
      serializer: defaultSerializer,
    });

    const result = await store.get("test-flow");

    expect(result).toBeNull();
  });

  it("should return null on get error", async () => {
    const storage = createStorageMock({
      getItem: vi.fn().mockRejectedValue(new Error("Storage error")),
    });

    const store = kvStorageAdapter({
      storage,
      formatKey: defaultFormatKey,
      serializer: defaultSerializer,
    });

    const result = await store.get("test-flow");

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
    const storage = createStorageMock({ setItem });

    const store = kvStorageAdapter({
      storage,
      formatKey: defaultFormatKey,
      serializer: defaultSerializer,
    });

    await store.set("test-flow", state);

    const instance = {
      flowId: "test-flow",
      instanceId: "default",
      variantId: "default",
      state,
    };

    expect(setItem).toHaveBeenCalledWith(
      "useflow:test-flow:default:default",
      JSON.stringify(instance),
    );
  });

  it("should remove state from storage", async () => {
    const removeItem = vi.fn().mockResolvedValue(undefined);
    const storage = createStorageMock({ removeItem });

    const store = kvStorageAdapter({
      storage,
      formatKey: defaultFormatKey,
      serializer: defaultSerializer,
    });

    await store.remove("test-flow");

    expect(removeItem).toHaveBeenCalledWith(
      "useflow:test-flow:default:default",
    );
  });

  it("should use custom formatKey function", async () => {
    const state: PersistedFlowState = {
      stepId: "step1",
      context: {},
      history: ["step1"],
      status: "active",
    };

    const instance = {
      flowId: "test-flow",
      instanceId: "default",
      variantId: "default",
      state,
    };

    const getItem = vi.fn().mockResolvedValue(JSON.stringify(instance));
    const setItem = vi.fn().mockResolvedValue(undefined);
    const removeItem = vi.fn().mockResolvedValue(undefined);
    const storage = createStorageMock({ getItem, setItem, removeItem });

    const formatKey = vi.fn(
      (flowId: string, instanceId?: string, variantId?: string) => {
        const vid = variantId || "default";
        const iid = instanceId || "default";
        return `myapp:user:${flowId}:${vid}:${iid}`;
      },
    );

    const store = kvStorageAdapter({
      storage,
      formatKey,
      serializer: defaultSerializer,
    });

    await store.get("test-flow");
    await store.set("test-flow", state);
    await store.remove("test-flow");

    expect(formatKey).toHaveBeenCalledTimes(3);
    expect(formatKey).toHaveBeenCalledWith("test-flow", "default", "default");
    expect(getItem).toHaveBeenCalledWith(
      "myapp:user:test-flow:default:default",
    );
    expect(setItem).toHaveBeenCalledWith(
      "myapp:user:test-flow:default:default",
      JSON.stringify(instance),
    );
    expect(removeItem).toHaveBeenCalledWith(
      "myapp:user:test-flow:default:default",
    );
  });

  it("should work with synchronous storage", async () => {
    const state: PersistedFlowState = {
      stepId: "step1",
      context: {},
      history: ["step1"],
      status: "active",
    };

    const instance = {
      flowId: "test-flow",
      instanceId: "default",
      variantId: "default",
      state,
    };

    const storage = createStorageMock({
      getItem: vi.fn().mockReturnValue(JSON.stringify(instance)),
    });

    const store = kvStorageAdapter({
      storage,
      formatKey: defaultFormatKey,
      serializer: defaultSerializer,
    });

    const result = await store.get("test-flow");

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

    const instance = {
      flowId: "test-flow",
      instanceId: "default",
      variantId: "default",
      state,
    };

    const storage = createStorageMock({
      getItem: vi.fn().mockResolvedValue(JSON.stringify(instance)),
    });

    const store = kvStorageAdapter({
      storage,
      formatKey: defaultFormatKey,
      serializer: defaultSerializer,
    });

    const result = await store.get("test-flow");

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

      const instance = {
        flowId: "test-flow",
        instanceId: "instance-123",
        variantId: "default",
        state,
      };

      const storage = createStorageMock({
        getItem: vi.fn().mockResolvedValue(JSON.stringify(instance)),
      });

      const store = kvStorageAdapter({
        storage,
        formatKey: defaultFormatKey,
        serializer: defaultSerializer,
      });

      const result = await store.get("test-flow", {
        instanceId: "instance-123",
      });

      expect(result).toEqual(state);
      expect(storage.getItem).toHaveBeenCalledWith(
        "useflow:test-flow:default:instance-123",
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
      const storage = createStorageMock({ setItem });

      const store = kvStorageAdapter({
        storage,
        formatKey: defaultFormatKey,
        serializer: defaultSerializer,
      });

      await store.set("test-flow", state, { instanceId: "instance-123" });

      const instance = {
        flowId: "test-flow",
        instanceId: "instance-123",
        variantId: "default",
        state,
      };

      expect(setItem).toHaveBeenCalledWith(
        "useflow:test-flow:default:instance-123",
        JSON.stringify(instance),
      );
    });

    it("should remove state with instanceId", async () => {
      const removeItem = vi.fn().mockResolvedValue(undefined);
      const storage = createStorageMock({ removeItem });

      const store = kvStorageAdapter({
        storage,
        formatKey: defaultFormatKey,
        serializer: defaultSerializer,
      });

      await store.remove("test-flow", { instanceId: "instance-123" });

      expect(removeItem).toHaveBeenCalledWith(
        "useflow:test-flow:default:instance-123",
      );
    });

    it("should use custom getKey with instanceId", async () => {
      const state: PersistedFlowState = {
        stepId: "step1",
        context: {},
        history: ["step1"],
        status: "active",
      };

      const instance = {
        flowId: "test-flow",
        instanceId: "task-456",
        variantId: "default",
        state,
      };

      const getItem = vi.fn().mockResolvedValue(JSON.stringify(instance));
      const storage = createStorageMock({ getItem });

      const formatKey = vi.fn(
        (flowId: string, instanceId?: string, variantId?: string) => {
          const vid = variantId || "default";
          const iid = instanceId || "default";
          return `custom:${flowId}:${vid}:${iid}`;
        },
      );

      const store = kvStorageAdapter({
        storage,
        formatKey,
        serializer: defaultSerializer,
      });

      await store.get("test-flow", { instanceId: "task-456" });

      expect(formatKey).toHaveBeenCalledWith(
        "test-flow",
        "task-456",
        "default",
      );
      expect(getItem).toHaveBeenCalledWith("custom:test-flow:default:task-456");
    });
  });

  describe("removeFlow", () => {
    it("should remove flow without instanceId", async () => {
      // Create a real object that acts as storage
      const mockData: Record<string, string> = {
        "useflow:test-flow:default:default": "{}",
        "useflow:other-flow:default:default": "{}",
      };

      const removeItem = vi.fn((key: string) => {
        delete mockData[key];
      });

      // Use mockData as the storage, with listKeys to enumerate
      const store = kvStorageAdapter({
        storage: Object.assign(mockData, {
          length: 0,
          clear: vi.fn(),
          key: vi.fn(() => null),
          getItem: vi.fn(() => null),
          setItem: vi.fn(),
          removeItem,
        }) as Storage,
        formatKey: defaultFormatKey,
        serializer: defaultSerializer,
        listKeys: createListKeys(mockData),
      });

      await store.removeFlow!("test-flow");

      expect(removeItem).toHaveBeenCalledWith(
        "useflow:test-flow:default:default",
      );
      expect(removeItem).not.toHaveBeenCalledWith(
        "useflow:other-flow:default:default",
      );
      expect(mockData).not.toHaveProperty("useflow:test-flow:default:default");
      expect(mockData).toHaveProperty("useflow:other-flow:default:default");
    });

    it("should remove flow with all instances", async () => {
      const mockData: Record<string, string> = {
        "useflow:test-flow:default:default": "{}",
        "useflow:test-flow:default:instance-1": "{}",
        "useflow:test-flow:default:instance-2": "{}",
        "useflow:other-flow:default:default": "{}",
      };

      const removeItem = vi.fn((key: string) => {
        delete mockData[key];
      });

      const store = kvStorageAdapter({
        storage: Object.assign(mockData, {
          length: 0,
          clear: vi.fn(),
          key: vi.fn(() => null),
          getItem: vi.fn(() => null),
          setItem: vi.fn(),
          removeItem,
        }) as Storage,
        formatKey: defaultFormatKey,
        serializer: defaultSerializer,
        listKeys: createListKeys(mockData),
      });

      await store.removeFlow!("test-flow");

      expect(removeItem).toHaveBeenCalledWith(
        "useflow:test-flow:default:default",
      );
      expect(removeItem).toHaveBeenCalledWith(
        "useflow:test-flow:default:instance-1",
      );
      expect(removeItem).toHaveBeenCalledWith(
        "useflow:test-flow:default:instance-2",
      );
      expect(removeItem).not.toHaveBeenCalledWith(
        "useflow:other-flow:default:default",
      );
      expect(removeItem).toHaveBeenCalledTimes(3);
    });

    it("should work with custom formatKey in removeFlow", async () => {
      const mockData: Record<string, string> = {
        "user123:test-flow:default:default": "{}",
        "user123:test-flow:default:instance-1": "{}",
        "user456:test-flow:default:default": "{}",
      };

      const removeItem = vi.fn((key: string) => {
        delete mockData[key];
      });

      const formatKey = vi.fn(
        (flowId: string, instanceId?: string, variantId?: string) => {
          const vid = variantId || "default";
          const iid = instanceId || "default";
          return `user123:${flowId}:${vid}:${iid}`;
        },
      );

      const store = kvStorageAdapter({
        storage: Object.assign(mockData, {
          length: 0,
          clear: vi.fn(),
          key: vi.fn(() => null),
          getItem: vi.fn(() => null),
          setItem: vi.fn(),
          removeItem,
        }) as Storage,
        formatKey,
        serializer: defaultSerializer,
        listKeys: (flowId) => {
          const allKeys = Object.keys(mockData);
          if (!flowId) return allKeys;
          const prefix = `user123:${flowId}:`;
          return allKeys.filter((key) => key.startsWith(prefix));
        },
      });

      await store.removeFlow!("test-flow");

      expect(removeItem).toHaveBeenCalledWith(
        "user123:test-flow:default:default",
      );
      expect(removeItem).toHaveBeenCalledWith(
        "user123:test-flow:default:instance-1",
      );
      expect(removeItem).not.toHaveBeenCalledWith(
        "user456:test-flow:default:default",
      );
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
        "useflow:test-flow:default:instance-1": JSON.stringify({
          flowId: "test-flow",
          instanceId: "instance-1",
          variantId: "default",
          state: state1,
        }),
        "useflow:test-flow:default:instance-2": JSON.stringify({
          flowId: "test-flow",
          instanceId: "instance-2",
          variantId: "default",
          state: state2,
        }),
        "useflow:other-flow:default:instance-1": JSON.stringify({
          flowId: "other-flow",
          instanceId: "instance-1",
          variantId: "default",
          state: {
            ...state1,
            __meta: { savedAt: Date.now(), instanceId: "instance-1" },
          },
        }),
      };

      const getItem = vi.fn((key: string) => mockData[key] || null);
      const key = vi.fn(
        (index: number) => Object.keys(mockData)[index] || null,
      );

      const store = kvStorageAdapter({
        storage: Object.assign(mockData, {
          length: Object.keys(mockData).length,
          clear: vi.fn(),
          key,
          getItem,
          setItem: vi.fn(),
          removeItem: vi.fn(),
        }) as Storage,
        formatKey: defaultFormatKey,
        serializer: defaultSerializer,
        listKeys: createListKeys(mockData),
      });

      const instances = await store.list("test-flow");

      expect(instances).toHaveLength(2);
      expect(instances).toEqual([
        {
          flowId: "test-flow",
          instanceId: "instance-1",
          variantId: "default",
          state: state1,
        },
        {
          flowId: "test-flow",
          instanceId: "instance-2",
          variantId: "default",
          state: state2,
        },
      ]);
    });

    it("should return empty array when no instances exist", async () => {
      const mockData: Record<string, string> = {
        "useflow:other-flow:default:instance-1": "{}",
      };

      const getItem = vi.fn((key: string) => mockData[key] || null);
      const key = vi.fn(
        (index: number) => Object.keys(mockData)[index] || null,
      );

      const store = kvStorageAdapter({
        storage: Object.assign(mockData, {
          length: Object.keys(mockData).length,
          clear: vi.fn(),
          key,
          getItem,
          setItem: vi.fn(),
          removeItem: vi.fn(),
        }) as Storage,
        formatKey: defaultFormatKey,
        serializer: defaultSerializer,
        listKeys: createListKeys(mockData),
      });

      const instances = await store.list("test-flow");

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
        "useflow:test-flow:default:instance-1": JSON.stringify({
          flowId: "test-flow",
          instanceId: "instance-1",
          variantId: "default",
          state: {
            ...state,
            __meta: { savedAt: Date.now(), instanceId: "instance-1" },
          },
        }),
        "useflow:test-flow:default:instance-2": "invalid json",
        "useflow:test-flow:default:instance-3": JSON.stringify({
          flowId: "test-flow",
          instanceId: "instance-3",
          variantId: "default",
          state: {
            ...state,
            __meta: { savedAt: Date.now(), instanceId: "instance-3" },
          },
        }),
      };

      const getItem = vi.fn((key: string) => mockData[key] || null);
      const key = vi.fn(
        (index: number) => Object.keys(mockData)[index] || null,
      );

      const store = kvStorageAdapter({
        storage: Object.assign(mockData, {
          length: Object.keys(mockData).length,
          clear: vi.fn(),
          key,
          getItem,
          setItem: vi.fn(),
          removeItem: vi.fn(),
        }) as Storage,
        formatKey: defaultFormatKey,
        serializer: defaultSerializer,
        listKeys: createListKeys(mockData),
      });

      const instances = await store.list("test-flow");

      expect(instances).toHaveLength(2);
      expect(instances).toEqual([
        {
          flowId: "test-flow",
          instanceId: "instance-1",
          variantId: "default",
          state: expect.objectContaining({
            ...state,
            __meta: expect.objectContaining({ instanceId: "instance-1" }),
          }),
        },
        {
          flowId: "test-flow",
          instanceId: "instance-3",
          variantId: "default",
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
        "useflow:test-flow:default:instance-1": JSON.stringify({
          flowId: "test-flow",
          instanceId: "instance-1",
          variantId: "default",
          state: {
            ...state,
            __meta: { savedAt: Date.now(), instanceId: "instance-1" },
          },
        }),
        "useflow:test-flow:default:instance-2": JSON.stringify({
          invalid: "structure",
        }), // Valid JSON but invalid state structure
        "useflow:test-flow:default:instance-3": JSON.stringify({
          flowId: "test-flow",
          instanceId: "instance-3",
          variantId: "default",
          state: {
            ...state,
            __meta: { savedAt: Date.now(), instanceId: "instance-3" },
          },
        }),
      };

      const getItem = vi.fn((key: string) => mockData[key] || null);
      const key = vi.fn(
        (index: number) => Object.keys(mockData)[index] || null,
      );

      const store = kvStorageAdapter({
        storage: Object.assign(mockData, {
          length: Object.keys(mockData).length,
          clear: vi.fn(),
          key,
          getItem,
          setItem: vi.fn(),
          removeItem: vi.fn(),
        }) as Storage,
        formatKey: defaultFormatKey,
        serializer: defaultSerializer,
        listKeys: createListKeys(mockData),
      });

      const instances = await store.list("test-flow");

      expect(instances).toHaveLength(2);
      expect(instances).toEqual([
        {
          flowId: "test-flow",
          instanceId: "instance-1",
          variantId: "default",
          state: expect.objectContaining({
            ...state,
            __meta: expect.objectContaining({ instanceId: "instance-1" }),
          }),
        },
        {
          flowId: "test-flow",
          instanceId: "instance-3",
          variantId: "default",
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
        "useflow:test-flow:default:instance-1": JSON.stringify({
          flowId: "test-flow",
          instanceId: "instance-1",
          variantId: "default",
          state: {
            ...state,
            __meta: { savedAt: Date.now(), instanceId: "instance-1" },
          },
        }),
        "useflow:test-flow:default:instance-2": JSON.stringify({
          flowId: "test-flow",
          instanceId: "instance-2",
          variantId: "default",
          state: {
            ...state,
            __meta: { savedAt: Date.now(), instanceId: "instance-2" },
          },
        }),
        "useflow:test-flow:default:instance-3": JSON.stringify({
          flowId: "test-flow",
          instanceId: "instance-3",
          variantId: "default",
          state: {
            ...state,
            __meta: { savedAt: Date.now(), instanceId: "instance-3" },
          },
        }),
      };

      const getItem = vi.fn((key: string) => {
        // Throw error for instance-2 to trigger the catch block
        if (key === "useflow:test-flow:default:instance-2") {
          throw new Error("Storage read error");
        }
        return mockData[key] || null;
      });

      const key = vi.fn(
        (index: number) => Object.keys(mockData)[index] || null,
      );

      const store = kvStorageAdapter({
        storage: Object.assign(mockData, {
          length: Object.keys(mockData).length,
          clear: vi.fn(),
          key,
          getItem,
          setItem: vi.fn(),
          removeItem: vi.fn(),
        }) as Storage,
        formatKey: defaultFormatKey,
        serializer: defaultSerializer,
        listKeys: createListKeys(mockData),
      });

      const instances = await store.list("test-flow");

      // Should skip instance-2 due to error and return only instance-1 and instance-3
      expect(instances).toHaveLength(2);
      expect(instances).toEqual([
        {
          flowId: "test-flow",
          instanceId: "instance-1",
          variantId: "default",
          state: expect.objectContaining({
            ...state,
            __meta: expect.objectContaining({ instanceId: "instance-1" }),
          }),
        },
        {
          flowId: "test-flow",
          instanceId: "instance-3",
          variantId: "default",
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
          flowId: "test-flow",
          instanceId: "instance-1",
          variantId: "default",
          state: {
            ...state,
            __meta: { savedAt: Date.now(), instanceId: "instance-1" },
          },
        }),
        "myapp:user123:test-flow:instance-2": JSON.stringify({
          flowId: "test-flow",
          instanceId: "instance-2",
          variantId: "default",
          state: {
            ...state,
            __meta: { savedAt: Date.now(), instanceId: "instance-2" },
          },
        }),
        "myapp:user456:test-flow:instance-1": JSON.stringify({
          flowId: "test-flow",
          instanceId: "instance-1",
          variantId: "default",
          state: {
            ...state,
            __meta: { savedAt: Date.now(), instanceId: "instance-1" },
          },
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

      const store = kvStorageAdapter({
        storage: Object.assign(mockData, {
          length: Object.keys(mockData).length,
          clear: vi.fn(),
          key,
          getItem,
          setItem: vi.fn(),
          removeItem: vi.fn(),
        }) as Storage,
        formatKey,
        serializer: defaultSerializer,
        listKeys: (flowId) => {
          const allKeys = Object.keys(mockData);
          if (!flowId) return allKeys;
          const baseKey = formatKey(flowId);
          return allKeys.filter(
            (key) => key === baseKey || key.startsWith(`${baseKey}:`),
          );
        },
      });

      const instances = await store.list("test-flow");

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
        "useflow:test-flow:default:default": JSON.stringify({
          flowId: "test-flow",
          instanceId: "default",
          variantId: "default",
          state,
        }), // Base key - should be included
        "useflow:test-flow:default:instance-1": JSON.stringify({
          flowId: "test-flow",
          instanceId: "instance-1",
          variantId: "default",
          state: {
            ...state,
            __meta: { savedAt: Date.now(), instanceId: "instance-1" },
          },
        }),
        "useflow:test-flow:default:instance-2": JSON.stringify({
          flowId: "test-flow",
          instanceId: "instance-2",
          variantId: "default",
          state: {
            ...state,
            __meta: { savedAt: Date.now(), instanceId: "instance-2" },
          },
        }),
      };

      const getItem = vi.fn((key: string) => mockData[key] || null);
      const key = vi.fn(
        (index: number) => Object.keys(mockData)[index] || null,
      );

      const store = kvStorageAdapter({
        storage: Object.assign(mockData, {
          length: Object.keys(mockData).length,
          clear: vi.fn(),
          key,
          getItem,
          setItem: vi.fn(),
          removeItem: vi.fn(),
        }) as Storage,
        formatKey: defaultFormatKey,
        serializer: defaultSerializer,
        listKeys: createListKeys(mockData),
      });

      const instances = await store.list("test-flow");

      expect(instances).toHaveLength(3);
      expect(instances).toEqual([
        {
          flowId: "test-flow",
          instanceId: "default",
          variantId: "default",
          state,
        }, // Base instance with default
        {
          flowId: "test-flow",
          instanceId: "instance-1",
          variantId: "default",
          state: expect.objectContaining({
            ...state,
            __meta: expect.objectContaining({ instanceId: "instance-1" }),
          }),
        },
        {
          flowId: "test-flow",
          instanceId: "instance-2",
          variantId: "default",
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
        "useflow:flow1:default:default": "{}",
        "useflow:flow2:default:default": "{}",
        "useflow:flow2:default:instance-1": "{}",
        "other:key": "{}",
      };

      const removeItem = vi.fn((key: string) => {
        delete mockData[key];
      });

      const store = kvStorageAdapter({
        storage: Object.assign(mockData, {
          length: 0,
          clear: vi.fn(),
          key: vi.fn(() => null),
          getItem: vi.fn(() => null),
          setItem: vi.fn(),
          removeItem,
        }) as Storage,
        formatKey: defaultFormatKey,
        serializer: defaultSerializer,
        listKeys: () =>
          Object.keys(mockData).filter((key) => key.startsWith("useflow:")),
      });

      await store.removeAll!();

      expect(removeItem).toHaveBeenCalledWith("useflow:flow1:default:default");
      expect(removeItem).toHaveBeenCalledWith("useflow:flow2:default:default");
      expect(removeItem).toHaveBeenCalledWith(
        "useflow:flow2:default:instance-1",
      );
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

      const store = kvStorageAdapter({
        storage: Object.assign(mockData, {
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
        serializer: defaultSerializer,
      });

      await store.removeAll!();

      expect(removeItem).toHaveBeenCalledWith("myapp:flow1");
      expect(removeItem).toHaveBeenCalledWith("myapp:flow2");
      expect(removeItem).not.toHaveBeenCalledWith("useflow:flow3");
    });

    it("should only remove keys returned by listKeys", async () => {
      const mockData: Record<string, string> = {
        "useflow:flow1:default:default": "{}",
        "useflow2:flow1": "{}",
        "myuseflow:flow1": "{}",
      };

      const removeItem = vi.fn((key: string) => {
        delete mockData[key];
      });

      const store = kvStorageAdapter({
        storage: Object.assign(mockData, {
          length: 0,
          clear: vi.fn(),
          key: vi.fn(() => null),
          getItem: vi.fn(() => null),
          setItem: vi.fn(),
          removeItem,
        }) as Storage,
        formatKey: defaultFormatKey,
        serializer: defaultSerializer,
        listKeys: () =>
          Object.keys(mockData).filter((key) => key.startsWith("useflow:")),
      });

      await store.removeAll!();

      expect(removeItem).toHaveBeenCalledWith("useflow:flow1:default:default");
      expect(removeItem).not.toHaveBeenCalledWith("useflow2:flow1");
      expect(removeItem).not.toHaveBeenCalledWith("myuseflow:flow1");
      expect(removeItem).toHaveBeenCalledTimes(1);
    });

    it("should be a no-op when listKeys is not provided", async () => {
      const removeItem = vi.fn();

      const store = kvStorageAdapter({
        storage: {
          length: 0,
          clear: vi.fn(),
          key: vi.fn(() => null),
          getItem: vi.fn(() => null),
          setItem: vi.fn(),
          removeItem,
        } as Storage,
        formatKey: defaultFormatKey,
        serializer: defaultSerializer,
        // No listKeys provided
      });

      await store.removeAll!();

      expect(removeItem).not.toHaveBeenCalled();
    });
  });

  describe("removeFlow", () => {
    it("should be a no-op when listKeys is not provided", async () => {
      const removeItem = vi.fn();

      const store = kvStorageAdapter({
        storage: {
          length: 0,
          clear: vi.fn(),
          key: vi.fn(() => null),
          getItem: vi.fn(() => null),
          setItem: vi.fn(),
          removeItem,
        } as Storage,
        formatKey: defaultFormatKey,
        serializer: defaultSerializer,
        // No listKeys provided
      });

      await store.removeFlow!("test-flow");

      expect(removeItem).not.toHaveBeenCalled();
    });
  });

  describe("list with edge cases", () => {
    it("should return empty array when listKeys is not provided", async () => {
      const store = kvStorageAdapter({
        storage: {
          length: 0,
          clear: vi.fn(),
          key: vi.fn(() => null),
          getItem: vi.fn(() => null),
          setItem: vi.fn(),
          removeItem: vi.fn(),
        } as Storage,
        formatKey: defaultFormatKey,
        serializer: defaultSerializer,
        // No listKeys provided
      });

      const instances = await store.list("test-flow");

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
        "useflow:test-flow:default:instance-1": JSON.stringify({
          flowId: "test-flow",
          instanceId: "instance-1",
          variantId: "default",
          state,
        }),
        "useflow:test-flow:default:instance-2": "", // Will result in getItem returning null
      };

      const getItem = vi.fn((key: string) => {
        // Return null for instance-2
        if (key === "useflow:test-flow:default:instance-2") {
          return null;
        }
        return mockData[key] || null;
      });

      const store = kvStorageAdapter({
        storage: {
          length: 0,
          clear: vi.fn(),
          key: vi.fn(() => null),
          getItem,
          setItem: vi.fn(),
          removeItem: vi.fn(),
        } as Storage,
        formatKey: defaultFormatKey,
        serializer: defaultSerializer,
        listKeys: () => Object.keys(mockData),
      });

      const instances = await store.list("test-flow");

      expect(instances).toHaveLength(1);
      expect(instances[0]?.instanceId).toBe("instance-1");
    });
  });

  describe("formatKey method", () => {
    it("should expose formatKey for custom key generation", () => {
      const mockStorage: Storage = {
        length: 0,
        clear: vi.fn(),
        key: vi.fn(() => null),
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      };

      const store = kvStorageAdapter({
        storage: mockStorage,
        formatKey: defaultFormatKey,
        serializer: defaultSerializer,
      });

      // Test formatKey with options
      const key1 = store.formatKey("my-flow", {
        instanceId: "task-123",
        variantId: "premium",
      });
      expect(key1).toBe("useflow:my-flow:premium:task-123");

      // Test formatKey with defaults
      const key2 = store.formatKey("my-flow", {});
      expect(key2).toBe("useflow:my-flow:default:default");

      // Test formatKey with undefined options
      const key3 = store.formatKey("my-flow");
      expect(key3).toBe("useflow:my-flow:default:default");
    });
  });
});
