import { describe, expect, it } from "vitest";
import type { PersistedFlowState } from "../../types";
import { createMemoryStore } from "./memory";

describe("createMemoryStore", () => {
  it("should get state from memory", () => {
    const store = createMemoryStore();

    const state: PersistedFlowState = {
      stepId: "step1",
      context: { name: "John" },
      history: ["step1"],
      status: "active",
    };

    store.set("test-flow", state);
    const result = store.get("test-flow");

    expect(result).toEqual(state);
  });

  it("should return null when no state exists", () => {
    const store = createMemoryStore();

    const result = store.get("test-flow");

    expect(result).toBeNull();
  });

  it("should set state to memory", () => {
    const store = createMemoryStore();

    const state: PersistedFlowState = {
      stepId: "step1",
      context: { name: "John" },
      history: ["step1"],
      status: "active",
    };

    store.set("test-flow", state);
    const result = store.get("test-flow");

    expect(result).toEqual(state);
  });

  it("should remove state from memory", () => {
    const store = createMemoryStore();

    const state: PersistedFlowState = {
      stepId: "step1",
      context: {},
      history: ["step1"],
      status: "active",
    };

    store.set("test-flow", state);
    expect(store.get("test-flow")).toEqual(state);

    store.remove("test-flow");
    expect(store.get("test-flow")).toBeNull();
  });

  it("should store multiple flows independently", () => {
    const store = createMemoryStore();

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

    store.set("flow1", state1);
    store.set("flow2", state2);

    expect(store.get("flow1")).toEqual(state1);
    expect(store.get("flow2")).toEqual(state2);
  });

  it("should overwrite existing state", () => {
    const store = createMemoryStore();

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

    store.set("test-flow", state1);
    expect(store.get("test-flow")).toEqual(state1);

    store.set("test-flow", state2);
    expect(store.get("test-flow")).toEqual(state2);
  });

  it("should store state with metadata", () => {
    const store = createMemoryStore();

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

    store.set("test-flow", state);
    const result = store.get("test-flow");

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
      const store = createMemoryStore();

      const state: PersistedFlowState = {
        stepId: "step1",
        context: {},
        history: ["step1"],
        status: "active",
      };

      store.set("test-flow", state, { instanceId: "instance-123" });
      const result = store.get("test-flow", { instanceId: "instance-123" });

      expect(result).toEqual(state);
    });

    it("should keep instances separate", () => {
      const store = createMemoryStore();

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

      store.set("test-flow", state1, { instanceId: "instance-1" });
      store.set("test-flow", state2, { instanceId: "instance-2" });

      expect(store.get("test-flow", { instanceId: "instance-1" })).toEqual(
        state1,
      );
      expect(store.get("test-flow", { instanceId: "instance-2" })).toEqual(
        state2,
      );
    });

    it("should remove state with instanceId", () => {
      const store = createMemoryStore();

      const state: PersistedFlowState = {
        stepId: "step1",
        context: {},
        history: ["step1"],
        status: "active",
      };

      store.set("test-flow", state, { instanceId: "instance-123" });
      expect(store.get("test-flow", { instanceId: "instance-123" })).toEqual(
        state,
      );

      store.remove("test-flow", { instanceId: "instance-123" });
      expect(store.get("test-flow", { instanceId: "instance-123" })).toBeNull();
    });

    it("should keep flow without instanceId separate from instances", () => {
      const store = createMemoryStore();

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

      store.set("test-flow", state1);
      store.set("test-flow", state2, { instanceId: "instance-1" });

      expect(store.get("test-flow")).toEqual(state1);
      expect(store.get("test-flow", { instanceId: "instance-1" })).toEqual(
        state2,
      );
    });
  });

  describe("removeFlow", () => {
    it("should remove flow without instances", () => {
      const store = createMemoryStore();

      const state: PersistedFlowState = {
        stepId: "step1",
        context: {},
        history: ["step1"],
        status: "active",
      };

      store.set("test-flow", state);
      store.set("other-flow", state);

      store.removeFlow!("test-flow");

      expect(store.get("test-flow")).toBeNull();
      expect(store.get("other-flow")).toEqual(state);
    });

    it("should remove flow with all instances", () => {
      const store = createMemoryStore();

      const state: PersistedFlowState = {
        stepId: "step1",
        context: {},
        history: ["step1"],
        status: "active",
      };

      store.set("test-flow", state);
      store.set("test-flow", state, { instanceId: "instance-1" });
      store.set("test-flow", state, { instanceId: "instance-2" });
      store.set("other-flow", state);

      store.removeFlow!("test-flow");

      expect(store.get("test-flow")).toBeNull();
      expect(store.get("test-flow", { instanceId: "instance-1" })).toBeNull();
      expect(store.get("test-flow", { instanceId: "instance-2" })).toBeNull();
      expect(store.get("other-flow")).toEqual(state);
    });
  });

  describe("removeAll", () => {
    it("should remove all flows and instances", () => {
      const store = createMemoryStore();

      const state: PersistedFlowState = {
        stepId: "step1",
        context: {},
        history: ["step1"],
        status: "active",
      };

      store.set("flow1", state);
      store.set("flow2", state);
      store.set("flow2", state, { instanceId: "instance-1" });

      store.removeAll!();

      expect(store.get("flow1")).toBeNull();
      expect(store.get("flow2")).toBeNull();
      expect(store.get("flow2", { instanceId: "instance-1" })).toBeNull();
    });
  });

  describe("list", () => {
    it("should list all instances of a flow", () => {
      const store = createMemoryStore();

      const state1: PersistedFlowState = {
        stepId: "step1",
        context: { name: "Task 1" },
        history: ["step1"],
        status: "active",
      };

      const state2: PersistedFlowState = {
        stepId: "step2",
        context: { name: "Task 2" },
        history: ["step1", "step2"],
        status: "active",
      };

      store.set("test-flow", state1, { instanceId: "instance-1" });
      store.set("test-flow", state2, { instanceId: "instance-2" });
      store.set("other-flow", state1, { instanceId: "instance-1" });

      const instances = store.list("test-flow");

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

    it("should return empty array when no instances exist", () => {
      const store = createMemoryStore();

      const state: PersistedFlowState = {
        stepId: "step1",
        context: {},
        history: ["step1"],
        status: "active",
      };

      store.set("other-flow", state, { instanceId: "instance-1" });

      const instances = store.list("test-flow");

      expect(instances).toEqual([]);
    });

    it("should include base flow key with undefined instanceId", () => {
      const store = createMemoryStore();

      const baseState: PersistedFlowState = {
        stepId: "step1",
        context: { type: "base" },
        history: ["step1"],
        status: "active",
      };

      const instance1State: PersistedFlowState = {
        stepId: "step2",
        context: { type: "instance1" },
        history: ["step1", "step2"],
        status: "active",
      };

      const instance2State: PersistedFlowState = {
        stepId: "step3",
        context: { type: "instance2" },
        history: ["step1", "step2", "step3"],
        status: "active",
      };

      store.set("test-flow", baseState); // Base flow without instanceId
      store.set("test-flow", instance1State, { instanceId: "instance-1" });
      store.set("test-flow", instance2State, { instanceId: "instance-2" });

      const instances = store.list("test-flow");

      expect(instances).toHaveLength(3);
      expect(instances).toEqual(
        expect.arrayContaining([
          {
            flowId: "test-flow",
            instanceId: "default",
            variantId: "default",
            state: baseState,
          }, // Base instance defaults to "default"
          {
            flowId: "test-flow",
            instanceId: "instance-1",
            variantId: "default",
            state: instance1State,
          },
          {
            flowId: "test-flow",
            instanceId: "instance-2",
            variantId: "default",
            state: instance2State,
          },
        ]),
      );
    });

    it("should only list instances for the specified flow", () => {
      const store = createMemoryStore();

      const state: PersistedFlowState = {
        stepId: "step1",
        context: {},
        history: ["step1"],
        status: "active",
      };

      store.set("flow1", state);
      store.set("flow1", state, { instanceId: "instance-1" });
      store.set("flow2", state);
      store.set("flow2", state, { instanceId: "instance-1" });

      const instances = store.list("flow1") as Array<{
        instanceId: string;
        variantId: string;
        state: PersistedFlowState;
      }>;

      expect(instances).toHaveLength(2);
      const hasCorrectIds = instances.every(
        (i) =>
          i.instanceId === "default" || i.instanceId.startsWith("instance-"),
      );
      expect(hasCorrectIds).toBe(true);
    });
  });
});
