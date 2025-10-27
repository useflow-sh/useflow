import { describe, expect, it } from "vitest";
import { createMemoryStorage } from "./memory";
import type { PersistedFlowState } from "./state";

describe("createMemoryStorage", () => {
  it("should get state from memory", () => {
    const storage = createMemoryStorage();

    const state: PersistedFlowState = {
      stepId: "step1",
      context: { name: "John" },
      history: ["step1"],
      status: "active",
    };

    storage.set("test-flow", state);
    const result = storage.get("test-flow");

    expect(result).toEqual(state);
  });

  it("should return null when no state exists", () => {
    const storage = createMemoryStorage();

    const result = storage.get("test-flow");

    expect(result).toBeNull();
  });

  it("should set state to memory", () => {
    const storage = createMemoryStorage();

    const state: PersistedFlowState = {
      stepId: "step1",
      context: { name: "John" },
      history: ["step1"],
      status: "active",
    };

    storage.set("test-flow", state);
    const result = storage.get("test-flow");

    expect(result).toEqual(state);
  });

  it("should remove state from memory", () => {
    const storage = createMemoryStorage();

    const state: PersistedFlowState = {
      stepId: "step1",
      context: {},
      history: ["step1"],
      status: "active",
    };

    storage.set("test-flow", state);
    expect(storage.get("test-flow")).toEqual(state);

    storage.remove("test-flow");
    expect(storage.get("test-flow")).toBeNull();
  });

  it("should store multiple flows independently", () => {
    const storage = createMemoryStorage();

    const state1: PersistedFlowState = {
      stepId: "step1",
      context: { name: "Flow1" },
      history: ["step1"],
      status: "active",
    };

    const state2: PersistedFlowState = {
      stepId: "step2",
      context: { name: "Flow2" },
      history: ["step2"],
      status: "active",
    };

    storage.set("flow1", state1);
    storage.set("flow2", state2);

    expect(storage.get("flow1")).toEqual(state1);
    expect(storage.get("flow2")).toEqual(state2);
  });

  it("should overwrite existing state", () => {
    const storage = createMemoryStorage();

    const state1: PersistedFlowState = {
      stepId: "step1",
      context: { count: 1 },
      history: ["step1"],
      status: "active",
    };

    const state2: PersistedFlowState = {
      stepId: "step2",
      context: { count: 2 },
      history: ["step1", "step2"],
      status: "active",
    };

    storage.set("test-flow", state1);
    expect(storage.get("test-flow")).toEqual(state1);

    storage.set("test-flow", state2);
    expect(storage.get("test-flow")).toEqual(state2);
  });

  it("should store state with metadata", () => {
    const storage = createMemoryStorage();

    const savedAt = Date.now();
    const state: PersistedFlowState = {
      stepId: "step1",
      context: { name: "John" },
      history: ["step1"],
      status: "active",
      __meta: {
        savedAt,
        version: "v1",
      },
    };

    storage.set("test-flow", state);
    const result = storage.get("test-flow");

    expect(result).toEqual({
      stepId: "step1",
      context: { name: "John" },
      history: ["step1"],
      status: "active",
      __meta: {
        savedAt,
        version: "v1",
      },
    });
  });

  describe("instanceId support", () => {
    it("should store state with instanceId", () => {
      const storage = createMemoryStorage();

      const state: PersistedFlowState = {
        stepId: "step1",
        context: {},
        history: ["step1"],
        status: "active",
      };

      storage.set("test-flow", state, "instance-123");
      const result = storage.get("test-flow", "instance-123");

      expect(result).toEqual(state);
    });

    it("should keep instances separate", () => {
      const storage = createMemoryStorage();

      const state1: PersistedFlowState = {
        stepId: "step1",
        context: { id: 1 },
        history: ["step1"],
        status: "active",
      };

      const state2: PersistedFlowState = {
        stepId: "step2",
        context: { id: 2 },
        history: ["step2"],
        status: "active",
      };

      storage.set("test-flow", state1, "instance-1");
      storage.set("test-flow", state2, "instance-2");

      expect(storage.get("test-flow", "instance-1")).toEqual(state1);
      expect(storage.get("test-flow", "instance-2")).toEqual(state2);
    });

    it("should remove state with instanceId", () => {
      const storage = createMemoryStorage();

      const state: PersistedFlowState = {
        stepId: "step1",
        context: {},
        history: ["step1"],
        status: "active",
      };

      storage.set("test-flow", state, "instance-123");
      expect(storage.get("test-flow", "instance-123")).toEqual(state);

      storage.remove("test-flow", "instance-123");
      expect(storage.get("test-flow", "instance-123")).toBeNull();
    });

    it("should keep flow without instanceId separate from instances", () => {
      const storage = createMemoryStorage();

      const state1: PersistedFlowState = {
        stepId: "step1",
        context: { type: "base" },
        history: ["step1"],
        status: "active",
      };

      const state2: PersistedFlowState = {
        stepId: "step2",
        context: { type: "instance" },
        history: ["step2"],
        status: "active",
      };

      storage.set("test-flow", state1);
      storage.set("test-flow", state2, "instance-1");

      expect(storage.get("test-flow")).toEqual(state1);
      expect(storage.get("test-flow", "instance-1")).toEqual(state2);
    });
  });

  describe("removeFlow", () => {
    it("should remove flow without instances", () => {
      const storage = createMemoryStorage();

      const state: PersistedFlowState = {
        stepId: "step1",
        context: {},
        history: ["step1"],
        status: "active",
      };

      storage.set("test-flow", state);
      storage.set("other-flow", state);

      storage.removeFlow!("test-flow");

      expect(storage.get("test-flow")).toBeNull();
      expect(storage.get("other-flow")).toEqual(state);
    });

    it("should remove flow with all instances", () => {
      const storage = createMemoryStorage();

      const state: PersistedFlowState = {
        stepId: "step1",
        context: {},
        history: ["step1"],
        status: "active",
      };

      storage.set("test-flow", state);
      storage.set("test-flow", state, "instance-1");
      storage.set("test-flow", state, "instance-2");
      storage.set("other-flow", state);

      storage.removeFlow!("test-flow");

      expect(storage.get("test-flow")).toBeNull();
      expect(storage.get("test-flow", "instance-1")).toBeNull();
      expect(storage.get("test-flow", "instance-2")).toBeNull();
      expect(storage.get("other-flow")).toEqual(state);
    });
  });

  describe("removeAll", () => {
    it("should remove all flows and instances", () => {
      const storage = createMemoryStorage();

      const state: PersistedFlowState = {
        stepId: "step1",
        context: {},
        history: ["step1"],
        status: "active",
      };

      storage.set("flow1", state);
      storage.set("flow2", state);
      storage.set("flow2", state, "instance-1");

      storage.removeAll!();

      expect(storage.get("flow1")).toBeNull();
      expect(storage.get("flow2")).toBeNull();
      expect(storage.get("flow2", "instance-1")).toBeNull();
    });
  });
});
