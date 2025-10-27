import { describe, expect, it, vi } from "vitest";
import { kvJsonStorageAdapter } from "./kv-json-storage-adapter";
import type { PersistedFlowState } from "./state";

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

    const storage = kvJsonStorageAdapter({ store });

    const result = await storage.get("test-flow");

    expect(result).toEqual(state);
    expect(store.getItem).toHaveBeenCalledWith("useflow:test-flow");
  });

  it("should return null when no state exists", async () => {
    const store = createStorageMock({
      getItem: vi.fn().mockResolvedValue(null),
    });

    const storage = kvJsonStorageAdapter({ store });

    const result = await storage.get("test-flow");

    expect(result).toBeNull();
  });

  it("should return null on invalid JSON", async () => {
    const store = createStorageMock({
      getItem: vi.fn().mockResolvedValue("invalid json"),
    });

    const storage = kvJsonStorageAdapter({ store });

    const result = await storage.get("test-flow");

    expect(result).toBeNull();
  });

  it("should return null on get error", async () => {
    const store = createStorageMock({
      getItem: vi.fn().mockRejectedValue(new Error("Storage error")),
    });

    const storage = kvJsonStorageAdapter({ store });

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

    const storage = kvJsonStorageAdapter({ store });

    await storage.set("test-flow", state);

    expect(setItem).toHaveBeenCalledWith(
      "useflow:test-flow",
      JSON.stringify(state),
    );
  });

  it("should remove state from storage", async () => {
    const removeItem = vi.fn().mockResolvedValue(undefined);
    const store = createStorageMock({ removeItem });

    const storage = kvJsonStorageAdapter({ store });

    await storage.remove("test-flow");

    expect(removeItem).toHaveBeenCalledWith("useflow:test-flow");
  });

  it("should use custom getKey function with prefix", async () => {
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

    const getKey = vi.fn((flowId: string, instanceId?: string) =>
      instanceId ? `user:${flowId}:${instanceId}` : `user:${flowId}`,
    );

    const storage = kvJsonStorageAdapter({ store, prefix: "myapp", getKey });

    await storage.get("test-flow");
    await storage.set("test-flow", state);
    await storage.remove("test-flow");

    expect(getKey).toHaveBeenCalledTimes(3);
    expect(getKey).toHaveBeenCalledWith("test-flow", undefined);
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

    const storage = kvJsonStorageAdapter({ store });

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

    const storage = kvJsonStorageAdapter({ store });

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

      const storage = kvJsonStorageAdapter({ store });

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

      const storage = kvJsonStorageAdapter({ store });

      await storage.set("test-flow", state, "instance-123");

      expect(setItem).toHaveBeenCalledWith(
        "useflow:test-flow:instance-123",
        JSON.stringify(state),
      );
    });

    it("should remove state with instanceId", async () => {
      const removeItem = vi.fn().mockResolvedValue(undefined);
      const store = createStorageMock({ removeItem });

      const storage = kvJsonStorageAdapter({ store });

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

      const getKey = vi.fn((flowId: string, instanceId?: string) =>
        instanceId ? `custom:${flowId}:${instanceId}` : `custom:${flowId}`,
      );

      const storage = kvJsonStorageAdapter({ store, getKey });

      await storage.get("test-flow", "task-456");

      expect(getKey).toHaveBeenCalledWith("test-flow", "task-456");
      expect(getItem).toHaveBeenCalledWith("useflow:custom:test-flow:task-456");
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

      // Use mockData as the store, which Object.keys() can iterate
      const storage = kvJsonStorageAdapter({
        store: Object.assign(mockData, {
          length: 0,
          clear: vi.fn(),
          key: vi.fn(() => null),
          getItem: vi.fn(() => null),
          setItem: vi.fn(),
          removeItem,
        }) as Storage,
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
      });

      await storage.removeFlow!("test-flow");

      expect(removeItem).toHaveBeenCalledWith("useflow:test-flow");
      expect(removeItem).toHaveBeenCalledWith("useflow:test-flow:instance-1");
      expect(removeItem).toHaveBeenCalledWith("useflow:test-flow:instance-2");
      expect(removeItem).not.toHaveBeenCalledWith("useflow:other-flow");
      expect(removeItem).toHaveBeenCalledTimes(3);
    });

    it("should work with custom getKey in removeFlow", async () => {
      const mockData: Record<string, string> = {
        "useflow:user123:test-flow": "{}",
        "useflow:user123:test-flow:instance-1": "{}",
        "useflow:user456:test-flow": "{}",
      };

      const removeItem = vi.fn((key: string) => {
        delete mockData[key];
      });

      const getKey = vi.fn((flowId: string, instanceId?: string) =>
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
        getKey,
      });

      await storage.removeFlow!("test-flow");

      expect(removeItem).toHaveBeenCalledWith("useflow:user123:test-flow");
      expect(removeItem).toHaveBeenCalledWith(
        "useflow:user123:test-flow:instance-1",
      );
      expect(removeItem).not.toHaveBeenCalledWith("useflow:user456:test-flow");
    });
  });

  describe("removeAll", () => {
    it("should remove all flows with default prefix", async () => {
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
      });

      await storage.removeAll!();

      expect(removeItem).toHaveBeenCalledWith("useflow:flow1");
      expect(removeItem).toHaveBeenCalledWith("useflow:flow2");
      expect(removeItem).toHaveBeenCalledWith("useflow:flow2:instance-1");
      expect(removeItem).not.toHaveBeenCalledWith("other:key");
      expect(removeItem).toHaveBeenCalledTimes(3);
    });

    it("should remove all flows with custom prefix", async () => {
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
        prefix: "myapp",
      });

      await storage.removeAll!();

      expect(removeItem).toHaveBeenCalledWith("myapp:flow1");
      expect(removeItem).toHaveBeenCalledWith("myapp:flow2");
      expect(removeItem).not.toHaveBeenCalledWith("useflow:flow3");
    });

    it("should only remove keys with exact prefix match", async () => {
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
      });

      await storage.removeAll!();

      expect(removeItem).toHaveBeenCalledWith("useflow:flow1");
      expect(removeItem).not.toHaveBeenCalledWith("useflow2:flow1");
      expect(removeItem).not.toHaveBeenCalledWith("myuseflow:flow1");
      expect(removeItem).toHaveBeenCalledTimes(1);
    });
  });
});
