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

  it("should skip with skip()", () => {
    const definition: FlowDefinition<{ skipped: boolean }> = {
      id: "test",
      start: "first",
      steps: {
        first: { next: "second" },
        second: {},
      },
    };

    const { result } = renderHook(() =>
      useFlowReducer(definition, { skipped: false }),
    );

    act(() => {
      result.current.skip();
    });

    expect(result.current.stepId).toBe("second");
    expect(result.current.history[0]).toMatchObject({
      stepId: "first",
      action: "skip",
    });
  });

  it("should skip with skip(update)", () => {
    const definition: FlowDefinition<{ skipped: boolean }> = {
      id: "test",
      start: "preferences",
      steps: {
        preferences: { next: "complete" },
        complete: {},
      },
    };

    const { result } = renderHook(() =>
      useFlowReducer(definition, { skipped: false }),
    );

    act(() => {
      result.current.skip({ skipped: true });
    });

    expect(result.current.stepId).toBe("complete");
    expect(result.current.context.skipped).toBe(true);
    expect(result.current.history[0]).toMatchObject({
      stepId: "preferences",
      action: "skip",
    });
  });

  it("should skip with skip(target, update)", () => {
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
      result.current.skip("option1", { choice: "skipped-to-option1" });
    });

    expect(result.current.stepId).toBe("option1");
    expect(result.current.context.choice).toBe("skipped-to-option1");
    expect(result.current.history[0]).toMatchObject({
      stepId: "menu",
      action: "skip",
    });
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
    expect(result.current.path).toEqual([
      { stepId: "first", startedAt: expect.any(Number) },
    ]);

    // Navigate forward
    act(() => {
      result.current.next();
    });
    expect(result.current.path).toEqual([
      {
        stepId: "first",
        startedAt: expect.any(Number),
        completedAt: expect.any(Number),
        action: "next",
      },
      { stepId: "second", startedAt: expect.any(Number) },
    ]);

    // Navigate forward again
    act(() => {
      result.current.next();
    });
    expect(result.current.path).toEqual([
      {
        stepId: "first",
        startedAt: expect.any(Number),
        completedAt: expect.any(Number),
        action: "next",
      },
      {
        stepId: "second",
        startedAt: expect.any(Number),
        completedAt: expect.any(Number),
        action: "next",
      },
      { stepId: "third", startedAt: expect.any(Number) },
    ]);

    // Navigate back
    act(() => {
      result.current.back();
    });
    expect(result.current.path).toEqual([
      {
        stepId: "first",
        startedAt: expect.any(Number),
        completedAt: expect.any(Number),
        action: "next",
      },
      { stepId: "second", startedAt: expect.any(Number) },
    ]);
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
        startedAt: 1234567890,
        path: [
          {
            stepId: "first",
            startedAt: 1234567890,
            completedAt: 1234567890,
            action: "next" as const,
          },
          { stepId: "second", startedAt: 1234567891 },
        ],
        history: [
          {
            stepId: "first",
            startedAt: 1234567890,
            completedAt: 1234567890,
            action: "next" as const,
          },
          { stepId: "second", startedAt: 1234567891 },
        ],
        status: "active" as const,
      };

      const { result } = renderHook(() =>
        useFlowReducer(definition, { count: 0 }, initialState),
      );

      expect(result.current.stepId).toBe("second");
      expect(result.current.context).toEqual({ count: 5 });
      expect(result.current.path).toEqual([
        {
          stepId: "first",
          startedAt: expect.any(Number),
          completedAt: expect.any(Number),
          action: "next",
        },
        { stepId: "second", startedAt: expect.any(Number) },
      ]);
    });
  });

  describe("reset", () => {
    it("should reset to initial state", () => {
      const definition: FlowDefinition<{ count: number; name: string }> = {
        id: "test",
        start: "first",
        steps: {
          first: { next: "second" },
          second: { next: "third" },
          third: {},
        },
      };

      const { result } = renderHook(() =>
        useFlowReducer(definition, { count: 0, name: "initial" }),
      );

      // Navigate and modify context
      act(() => {
        result.current.next({ count: 5, name: "modified" });
      });
      expect(result.current.stepId).toBe("second");
      expect(result.current.context).toEqual({ count: 5, name: "modified" });

      act(() => {
        result.current.next();
      });
      expect(result.current.stepId).toBe("third");

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.stepId).toBe("first");
      expect(result.current.context).toEqual({ count: 0, name: "initial" });
      expect(result.current.path).toEqual([
        { stepId: "first", startedAt: expect.any(Number) },
      ]);
      expect(result.current.status).toBe("active");
    });

    it("should reset from completed state", () => {
      const definition: FlowDefinition<{ value: string }> = {
        id: "test",
        start: "first",
        steps: {
          first: { next: "last" },
          last: {}, // Terminal step
        },
      };

      const { result } = renderHook(() =>
        useFlowReducer(definition, { value: "start" }),
      );

      // Complete the flow
      act(() => {
        result.current.next({ value: "end" });
      });
      expect(result.current.stepId).toBe("last");
      expect(result.current.status).toBe("complete");

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.stepId).toBe("first");
      expect(result.current.status).toBe("active");
      expect(result.current.context.value).toBe("start");
    });

    it("should use original initialContext, not re-render updates", () => {
      const definition: FlowDefinition<{ counter: number }> = {
        id: "test",
        start: "step1",
        steps: {
          step1: { next: "step2" },
          step2: {},
        },
      };

      const { result, rerender } = renderHook(
        ({ initialContext }) => useFlowReducer(definition, initialContext),
        {
          initialProps: { initialContext: { counter: 0 } },
        },
      );

      // Navigate and modify
      act(() => {
        result.current.next({ counter: 10 });
      });
      expect(result.current.context.counter).toBe(10);

      // Re-render with different initialContext (new object reference)
      rerender({ initialContext: { counter: 999 } });

      // Reset should still use original initialContext (0), not new one (999)
      act(() => {
        result.current.reset();
      });

      expect(result.current.context.counter).toBe(0);
      expect(result.current.stepId).toBe("step1");
    });

    it("should allow navigation after reset", () => {
      const definition: FlowDefinition<{ step: number }> = {
        id: "test",
        start: "a",
        steps: {
          a: { next: "b" },
          b: { next: "c" },
          c: {},
        },
      };

      const { result } = renderHook(() =>
        useFlowReducer(definition, { step: 0 }),
      );

      // Navigate through flow
      act(() => {
        result.current.next();
        result.current.next();
      });
      expect(result.current.stepId).toBe("c");

      // Reset
      act(() => {
        result.current.reset();
      });
      expect(result.current.stepId).toBe("a");

      // Should be able to navigate again
      act(() => {
        result.current.next({ step: 1 });
      });
      expect(result.current.stepId).toBe("b");
      expect(result.current.context.step).toBe(1);
      expect(result.current.path).toEqual([
        {
          stepId: "a",
          startedAt: expect.any(Number),
          completedAt: expect.any(Number),
          action: "next",
        },
        { stepId: "b", startedAt: expect.any(Number) },
      ]);
    });

    it("should have stable reset callback", () => {
      const definition: FlowDefinition<{ value: number }> = {
        id: "test",
        start: "first",
        steps: {
          first: { next: "second" },
          second: {},
        },
      };

      const { result, rerender } = renderHook(() =>
        useFlowReducer(definition, { value: 0 }),
      );

      const firstReset = result.current.reset;

      // Re-render
      rerender();

      // Reset callback should be stable
      expect(result.current.reset).toBe(firstReset);
    });
  });
});
