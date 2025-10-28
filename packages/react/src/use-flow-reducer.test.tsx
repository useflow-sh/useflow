import { act, renderHook } from "@testing-library/react";
import type { FlowDefinition } from "@useflow/core";
import { describe, expect, it } from "vitest";
import { useFlowReducer } from "./use-flow-reducer";

describe("useFlowReducer", () => {
  it("should initialize with start step", () => {
    const definition: FlowDefinition<{ count: number }> = {
      id: "test",
      start: "first",
      steps: {
        first: { next: "second" },
        second: {},
      },
    };

    const { result } = renderHook(() =>
      useFlowReducer(definition, { count: 0 }),
    );

    expect(result.current.stepId).toBe("first");
    expect(result.current.context).toEqual({ count: 0 });
    expect(result.current.status).toBe("active");
  });

  it("should navigate with next()", () => {
    const definition: FlowDefinition<{ count: number }> = {
      id: "test",
      start: "first",
      steps: {
        first: { next: "second" },
        second: {},
      },
    };

    const { result } = renderHook(() =>
      useFlowReducer(definition, { count: 0 }),
    );

    act(() => {
      result.current.next();
    });

    expect(result.current.stepId).toBe("second");
  });

  it("should navigate with next(target)", () => {
    const definition: FlowDefinition<object> = {
      id: "test",
      start: "menu",
      steps: {
        menu: { next: ["option1", "option2"] },
        option1: {},
        option2: {},
      },
    };

    const { result } = renderHook(() => useFlowReducer(definition, {}));

    act(() => {
      result.current.next("option2");
    });

    expect(result.current.stepId).toBe("option2");
  });

  it("should navigate with next(update)", () => {
    const definition: FlowDefinition<{ name: string }> = {
      id: "test",
      start: "first",
      steps: {
        first: { next: "second" },
        second: {},
      },
    };

    const { result } = renderHook(() =>
      useFlowReducer(definition, { name: "" }),
    );

    act(() => {
      result.current.next({ name: "Alice" });
    });

    expect(result.current.stepId).toBe("second");
    expect(result.current.context.name).toBe("Alice");
  });

  it("should navigate with next(target, update)", () => {
    const definition: FlowDefinition<{ choice: string }> = {
      id: "test",
      start: "menu",
      steps: {
        menu: { next: ["option1", "option2"] },
        option1: {},
        option2: {},
      },
    };

    const { result } = renderHook(() =>
      useFlowReducer(definition, { choice: "" }),
    );

    act(() => {
      result.current.next("option2", { choice: "option2" });
    });

    expect(result.current.stepId).toBe("option2");
    expect(result.current.context.choice).toBe("option2");
  });

  it("should go back with back()", () => {
    const definition: FlowDefinition<object> = {
      id: "test",
      start: "first",
      steps: {
        first: { next: "second" },
        second: {},
      },
    };

    const { result } = renderHook(() => useFlowReducer(definition, {}));

    act(() => {
      result.current.next();
    });

    expect(result.current.stepId).toBe("second");

    act(() => {
      result.current.back();
    });

    expect(result.current.stepId).toBe("first");
  });

  it("should update context with setContext()", () => {
    const definition: FlowDefinition<{ count: number }> = {
      id: "test",
      start: "counter",
      steps: {
        counter: {},
      },
    };

    const { result } = renderHook(() =>
      useFlowReducer(definition, { count: 0 }),
    );

    act(() => {
      result.current.setContext({ count: 5 });
    });

    expect(result.current.context.count).toBe(5);
  });

  it("should return empty object for step when stepId doesn't exist in definition", () => {
    const definition: FlowDefinition<object> = {
      id: "test",
      start: "first",
      steps: {
        first: { next: "second" },
        // Note: "second" is missing from steps (edge case)
      },
    };

    const { result } = renderHook(() => useFlowReducer(definition, {}));

    // Navigate to a step that doesn't exist in the definition
    act(() => {
      result.current.next();
    });

    // Should still navigate (reducer handles it)
    expect(result.current.stepId).toBe("second");
    // But step should be empty object since it doesn't exist
    expect(result.current.step).toEqual({});
  });

  it("should expose history array", () => {
    const definition: FlowDefinition<object> = {
      id: "test",
      start: "first",
      steps: {
        first: { next: "second" },
        second: { next: "third" },
        third: {},
      },
    };

    const { result } = renderHook(() => useFlowReducer(definition, {}));

    // Initial history should contain start step
    expect(result.current.history).toEqual(["first"]);

    // Navigate forward
    act(() => {
      result.current.next();
    });
    expect(result.current.history).toEqual(["first", "second"]);

    // Navigate forward again
    act(() => {
      result.current.next();
    });
    expect(result.current.history).toEqual(["first", "second", "third"]);

    // Navigate back
    act(() => {
      result.current.back();
    });
    expect(result.current.history).toEqual(["first", "second"]);
  });

  describe("persistence", () => {
    it("should initialize with given initial state", () => {
      const definition = {
        id: "test",
        start: "first",
        steps: {
          first: { next: "second" },
          second: {},
        },
      };

      const initialState = {
        stepId: "second",
        context: { count: 5 },
        history: ["first", "second"],
        status: "active" as const,
      };

      const { result } = renderHook(() =>
        useFlowReducer(definition, { count: 0 }, initialState),
      );

      expect(result.current.stepId).toBe("second");
      expect(result.current.context).toEqual({ count: 5 });
      expect(result.current.history).toEqual(["first", "second"]);
    });
  });
});
