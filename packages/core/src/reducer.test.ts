import { describe, expect, it, vi } from "vitest";
import {
  createInitialState,
  flowReducer,
  validateFlowDefinition,
} from "./reducer";
import type { FlowAction, FlowContext, FlowDefinition } from "./types";

describe("flowReducer", () => {
  it("should initialize flow state correctly", () => {
    type TestContext = { count: number };

    const definition: FlowDefinition<TestContext> = {
      id: "test",
      start: "idle",
      steps: {
        idle: { next: "active" },
        active: {},
      },
    };

    const state = createInitialState(definition, { count: 0 });

    expect(state.stepId).toBe("idle");
    expect(state.context).toEqual({ count: 0 });
    expect(state.history).toEqual(["idle"]);
    expect(state.status).toBe("active");
  });

  it("should navigate to next step", () => {
    type TestContext = { step: number };

    const definition: FlowDefinition<TestContext> = {
      id: "test",
      start: "first",
      steps: {
        first: { next: "second" },
        second: { next: "third" },
        third: {},
      },
    };

    let state = createInitialState(definition, { step: 1 });
    expect(state.stepId).toBe("first");

    state = flowReducer(state, { type: "NEXT" }, definition);
    expect(state.stepId).toBe("second");
    expect(state.history).toEqual(["first", "second"]);

    state = flowReducer(state, { type: "NEXT" }, definition);
    expect(state.stepId).toBe("third");
    expect(state.history).toEqual(["first", "second", "third"]);
  });

  it("should navigate back through history", () => {
    type TestContext = { step: number };

    const definition: FlowDefinition<TestContext> = {
      id: "test",
      start: "first",
      steps: {
        first: { next: "second" },
        second: { next: "third" },
        third: {},
      },
    };

    let state = createInitialState(definition, { step: 1 });
    state = flowReducer(state, { type: "NEXT" }, definition);
    state = flowReducer(state, { type: "NEXT" }, definition);

    expect(state.stepId).toBe("third");

    state = flowReducer(state, { type: "BACK" }, definition);
    expect(state.stepId).toBe("second");
    expect(state.history).toEqual(["first", "second"]);

    state = flowReducer(state, { type: "BACK" }, definition);
    expect(state.stepId).toBe("first");
    expect(state.history).toEqual(["first"]);
  });

  it("should not go back from first step", () => {
    type TestContext = { count: number };

    const definition: FlowDefinition<TestContext> = {
      id: "test",
      start: "first",
      steps: {
        first: { next: "second" },
        second: {},
      },
    };

    let state = createInitialState(definition, { count: 0 });
    state = flowReducer(state, { type: "BACK" }, definition);

    expect(state.stepId).toBe("first");
    expect(state.history).toEqual(["first"]);
  });

  it("should update context with SET_CONTEXT", () => {
    type TestContext = { name: string; age: number };

    const definition: FlowDefinition<TestContext> = {
      id: "test",
      start: "profile",
      steps: {
        profile: {},
      },
    };

    let state = createInitialState(definition, { name: "", age: 0 });

    state = flowReducer(
      state,
      { type: "SET_CONTEXT", update: { name: "Alice" } },
      definition,
    );
    expect(state.context).toEqual({ name: "Alice", age: 0 });

    state = flowReducer(
      state,
      { type: "SET_CONTEXT", update: { age: 30 } },
      definition,
    );
    expect(state.context).toEqual({ name: "Alice", age: 30 });
  });

  it("should update context and navigate with NEXT", () => {
    type TestContext = { name: string };

    const definition: FlowDefinition<TestContext> = {
      id: "test",
      start: "profile",
      steps: {
        profile: { next: "complete" },
        complete: {},
      },
    };

    let state = createInitialState(definition, { name: "" });

    state = flowReducer(
      state,
      { type: "NEXT", update: { name: "Bob" } },
      definition,
    );

    expect(state.stepId).toBe("complete");
    expect(state.context).toEqual({ name: "Bob" });
  });

  it("should support conditional next with function", () => {
    type TestContext = { isBusiness: boolean };

    const definition: FlowDefinition<TestContext> = {
      id: "test",
      start: "profile",
      steps: {
        profile: {
          next: (ctx) => (ctx.isBusiness ? "business" : "personal"),
        },
        business: {},
        personal: {},
      },
    };

    let state = createInitialState(definition, { isBusiness: true });
    state = flowReducer(state, { type: "NEXT" }, definition);
    expect(state.stepId).toBe("business");
    expect(state.status).toBe("complete"); // Final step

    state = createInitialState(definition, { isBusiness: false });
    state = flowReducer(state, { type: "NEXT" }, definition);
    expect(state.stepId).toBe("personal");
    expect(state.status).toBe("complete"); // Final step
  });

  it("should mark flow as done when reaching step with no next", () => {
    type TestContext = { completed: boolean };

    const definition: FlowDefinition<TestContext> = {
      id: "test",
      start: "active",
      steps: {
        active: { next: "complete" },
        done: {}, // No next = final
      },
    };

    let state = createInitialState(definition, { completed: false });
    expect(state.status).toBe("active");

    // Navigate to final step - status should immediately be "complete"
    state = flowReducer(state, { type: "NEXT" }, definition);
    expect(state.stepId).toBe("complete");
    expect(state.status).toBe("complete");

    // Trying to navigate from final step keeps status as "complete"
    state = flowReducer(state, { type: "NEXT" }, definition);
    expect(state.status).toBe("complete");
  });

  it("should stay on current step if guard returns undefined", () => {
    type TestContext = { isValid: boolean };

    const definition: FlowDefinition<TestContext> = {
      id: "test",
      start: "form",
      steps: {
        form: {
          next: (ctx) => (ctx.isValid ? "complete" : undefined),
        },
        complete: {},
      },
    };

    let state = createInitialState(definition, { isValid: false });
    state = flowReducer(state, { type: "NEXT" }, definition);

    expect(state.stepId).toBe("form");
    expect(state.history).toEqual(["form"]);

    state = flowReducer(
      state,
      { type: "SET_CONTEXT", update: { isValid: true } },
      definition,
    );
    state = flowReducer(state, { type: "NEXT" }, definition);

    expect(state.stepId).toBe("complete");
  });

  it("should support updater function for context updates", () => {
    type TestContext = { count: number; name: string };

    const definition: FlowDefinition<TestContext> = {
      id: "test",
      start: "counter",
      steps: {
        counter: { next: "result" },
        result: {},
      },
    };

    let state = createInitialState(definition, { count: 0, name: "Alice" });

    // Update with function - full control
    state = flowReducer(
      state,
      {
        type: "SET_CONTEXT",
        update: (ctx) => ({ count: ctx.count + 1, name: ctx.name }),
      },
      definition,
    );

    expect(state.context).toEqual({ count: 1, name: "Alice" });

    // Update with function - can override completely
    state = flowReducer(
      state,
      {
        type: "SET_CONTEXT",
        update: () => ({ count: 999, name: "Bob" }),
      },
      definition,
    );

    expect(state.context).toEqual({ count: 999, name: "Bob" });
  });

  it("should support updater function with NEXT action", () => {
    type TestContext = { count: number; timestamp: number };

    const definition: FlowDefinition<TestContext> = {
      id: "test",
      start: "form",
      steps: {
        form: { next: "complete" },
        complete: {},
      },
    };

    let state = createInitialState(definition, { count: 0, timestamp: 0 });

    // Navigate and update context with function
    state = flowReducer(
      state,
      {
        type: "NEXT",
        update: (ctx) => ({ count: ctx.count + 1, timestamp: Date.now() }),
      },
      definition,
    );

    expect(state.stepId).toBe("complete");
    expect(state.context.count).toBe(1);
    expect(state.context.timestamp).toBeGreaterThan(0);
  });

  it("should support updater function with conditional navigation", () => {
    type TestContext = { score: number };

    const definition: FlowDefinition<TestContext> = {
      id: "test",
      start: "game",
      steps: {
        game: {
          next: (ctx) => (ctx.score >= 100 ? "win" : "lose"),
        },
        win: {},
        lose: {},
      },
    };

    let state = createInitialState(definition, { score: 50 });

    // Update score and navigate - should go to "lose"
    state = flowReducer(
      state,
      {
        type: "NEXT",
        update: (ctx) => ({ score: ctx.score + 30 }),
      },
      definition,
    );

    expect(state.stepId).toBe("lose");
    expect(state.context.score).toBe(80);

    // Try again from game with higher score
    state = createInitialState(definition, { score: 90 });
    state = flowReducer(
      state,
      {
        type: "NEXT",
        update: (ctx) => ({ score: ctx.score + 20 }),
      },
      definition,
    );

    expect(state.stepId).toBe("win");
    expect(state.context.score).toBe(110);
  });

  it("should still support object updates (shallow merge)", () => {
    const definition: FlowDefinition<FlowContext> = {
      id: "test",
      start: "first",
      steps: {
        first: { next: "second" },
        second: {},
      },
    };

    const context = { name: "Alice", email: "", nested: { foo: "bar" } };
    const state = createInitialState(definition, context);

    const action: FlowAction<FlowContext> = {
      type: "NEXT",
      update: { name: "Bob" }, // Object update (shallow merge)
    };

    const newState = flowReducer(state, action, definition);

    expect(newState.context.name).toBe("Bob");
    expect(newState.context.email).toBe("");
    expect(newState.context.nested).toEqual({ foo: "bar" });
  });

  it("should support array-based next with target selection", () => {
    const flow: FlowDefinition<FlowContext> = {
      id: "test",
      start: "choice",
      steps: {
        choice: {
          next: ["optionA", "optionB", "optionC"],
        },
        optionA: {},
        optionB: {},
        optionC: {},
      },
    };

    const state = createInitialState(flow, {});

    // Navigate to optionB using target
    const action: FlowAction<FlowContext> = {
      type: "NEXT",
      target: "optionB",
    };

    const newState = flowReducer(state, action, flow);
    expect(newState.stepId).toBe("optionB");
  });

  it("should default to first item in array when no target specified", () => {
    const flow: FlowDefinition<FlowContext> = {
      id: "test",
      start: "choice",
      steps: {
        choice: {
          next: ["optionA", "optionB"],
        },
        optionA: {},
        optionB: {},
      },
    };

    const state = createInitialState(flow, {});

    // Navigate without target - should use first in array
    const action: FlowAction<FlowContext> = { type: "NEXT" };

    const newState = flowReducer(state, action, flow);
    expect(newState.stepId).toBe("optionA");
  });

  it("should warn and stay on step when target is not in array", () => {
    const flow: FlowDefinition<FlowContext> = {
      id: "test",
      start: "choice",
      steps: {
        choice: {
          next: ["optionA", "optionB"],
        },
        optionA: {},
        optionB: {},
        invalid: {},
      },
    };

    const state = createInitialState(flow, {});
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    // Try to navigate to invalid target
    const action: FlowAction<FlowContext> = {
      type: "NEXT",
      target: "invalid",
    };

    const newState = flowReducer(state, action, flow);
    expect(newState.stepId).toBe("choice"); // Should stay on same step
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Invalid target "invalid"'),
    );

    consoleSpy.mockRestore();
  });

  it("should support array-based navigation with context updates", () => {
    type TestContext = { choice: string };

    const flow: FlowDefinition<TestContext> = {
      id: "test",
      start: "menu",
      steps: {
        menu: {
          next: ["settings", "profile", "logout"],
        },
        settings: {},
        profile: {},
        logout: {},
      },
    };

    const state = createInitialState(flow, { choice: "" });

    // Navigate with context update
    const action: FlowAction<TestContext> = {
      type: "NEXT",
      target: "settings",
      update: { choice: "settings" },
    };

    const newState = flowReducer(state, action, flow);
    expect(newState.stepId).toBe("settings");
    expect(newState.context.choice).toBe("settings");
  });

  it("should support array-based navigation across multiple steps", () => {
    const flow: FlowDefinition<FlowContext> = {
      id: "test",
      start: "start",
      steps: {
        start: {
          next: ["pathA", "pathB"],
        },
        pathA: {
          next: ["end1", "end2"],
        },
        pathB: {
          next: ["end2", "end3"],
        },
        end1: {},
        end2: {},
        end3: {},
      },
    };

    let state = createInitialState(flow, {});
    expect(state.stepId).toBe("start");

    // Choose pathA
    state = flowReducer(state, { type: "NEXT", target: "pathA" }, flow);
    expect(state.stepId).toBe("pathA");

    // From pathA, choose end2
    state = flowReducer(state, { type: "NEXT", target: "end2" }, flow);
    expect(state.stepId).toBe("end2");
    expect(state.history).toEqual(["start", "pathA", "end2"]);
  });

  it("should combine context-based and array-based navigation", () => {
    type TestContext = {
      userType?: "business" | "personal";
      setupChoice?: string;
    };

    const flow: FlowDefinition<TestContext> = {
      id: "test",
      start: "userType",
      steps: {
        userType: {
          // Context-based branching
          next: (ctx) =>
            ctx.userType === "business" ? "businessSetup" : "setup",
        },
        businessSetup: {
          next: "setup",
        },
        setup: {
          // Array-based navigation
          next: ["advanced", "quick"],
        },
        advanced: {},
        quick: {},
      },
    };

    let state = createInitialState<TestContext>(flow, {});

    // Context-based: navigate as business
    state = flowReducer(
      state,
      { type: "NEXT", update: (ctx) => ({ ...ctx, userType: "business" }) },
      flow,
    );
    expect(state.stepId).toBe("businessSetup");

    // Continue to setup
    state = flowReducer(state, { type: "NEXT" }, flow);
    expect(state.stepId).toBe("setup");

    // Array-based: explicitly choose advanced
    state = flowReducer(
      state,
      {
        type: "NEXT",
        target: "advanced",
        update: (ctx) => ({ ...ctx, setupChoice: "advanced" }),
      },
      flow,
    );
    expect(state.stepId).toBe("advanced");
    expect(state.context.setupChoice).toBe("advanced");
  });

  it("should validate target against string next (single destination)", () => {
    const flow: FlowDefinition<FlowContext> = {
      id: "test",
      start: "step1",
      steps: {
        step1: {
          next: "step2", // Single destination
        },
        step2: {},
        step3: {},
      },
    };

    const state = createInitialState(flow, {});
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    // Try to navigate to wrong step
    const action: FlowAction<FlowContext> = {
      type: "NEXT",
      target: "step3",
    };

    const newState = flowReducer(state, action, flow);
    expect(newState.stepId).toBe("step1"); // Should stay on current step
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Invalid target "step3"'),
    );

    // Valid target should work
    const validAction: FlowAction<FlowContext> = {
      type: "NEXT",
      target: "step2",
    };

    const validState = flowReducer(state, validAction, flow);
    expect(validState.stepId).toBe("step2");

    consoleSpy.mockRestore();
  });

  it("should handle array navigation with back()", () => {
    const flow: FlowDefinition<FlowContext> = {
      id: "test",
      start: "menu",
      steps: {
        menu: {
          next: ["option1", "option2"],
        },
        option1: {
          next: "end",
        },
        option2: {
          next: "end",
        },
        end: {},
      },
    };

    let state = createInitialState(flow, {});

    // Navigate via array choice
    state = flowReducer(state, { type: "NEXT", target: "option2" }, flow);
    expect(state.stepId).toBe("option2");

    // Navigate forward
    state = flowReducer(state, { type: "NEXT" }, flow);
    expect(state.stepId).toBe("end");

    // Go back
    state = flowReducer(state, { type: "BACK" }, flow);
    expect(state.stepId).toBe("option2");

    // Go back again
    state = flowReducer(state, { type: "BACK" }, flow);
    expect(state.stepId).toBe("menu");
  });

  it("should validate target against function-based next", () => {
    type TestContext = { userType: "business" | "personal" };

    const flow: FlowDefinition<TestContext> = {
      id: "test",
      start: "profile",
      steps: {
        profile: {
          next: (ctx) =>
            ctx.userType === "business" ? "business" : "personal",
        },
        business: {},
        personal: {},
        other: {},
      },
    };

    const state = createInitialState<TestContext>(flow, {
      userType: "business",
    });
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    // Valid target: matches function result
    const validAction: FlowAction<TestContext> = {
      type: "NEXT",
      target: "business",
    };

    const validState = flowReducer(state, validAction, flow);
    expect(validState.stepId).toBe("business");

    // Invalid target: doesn't match function result
    const invalidAction: FlowAction<TestContext> = {
      type: "NEXT",
      target: "personal", // Function returns "business" but we're targeting "personal"
    };

    const invalidState = flowReducer(state, invalidAction, flow);
    expect(invalidState.stepId).toBe("profile"); // Should stay on current step
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Invalid target "personal"'),
    );

    consoleSpy.mockRestore();
  });

  it("should validate target that doesn't match function result", () => {
    type TestContext = { score: number };

    const flow: FlowDefinition<TestContext> = {
      id: "test",
      start: "game",
      steps: {
        game: {
          next: (ctx) => (ctx.score >= 100 ? "win" : "lose"),
        },
        win: {},
        lose: {},
      },
    };

    const state = createInitialState(flow, { score: 50 });
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    // Function returns "lose" (score < 100) but we try to target "win"
    const action: FlowAction<TestContext> = {
      type: "NEXT",
      target: "win",
    };

    const newState = flowReducer(state, action, flow);
    expect(newState.stepId).toBe("game"); // Should stay on current step
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Invalid target "win"'),
    );

    consoleSpy.mockRestore();
  });

  it("should return state unchanged for unknown action types", () => {
    const flow: FlowDefinition<FlowContext> = {
      id: "test",
      start: "test",
      steps: {
        test: {},
      },
    };

    const state = createInitialState(flow, { value: "test" });
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    // Pass an unknown action type (this should never happen with TypeScript, but tests runtime safety)
    const unknownAction = {
      type: "UNKNOWN_ACTION",
    } as unknown as FlowAction<FlowContext>;

    const newState = flowReducer(state, unknownAction, flow);

    // Should return state unchanged
    expect(newState).toBe(state);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Unknown action type: UNKNOWN_ACTION"),
    );

    consoleSpy.mockRestore();
  });
});

describe("validateFlowDefinition", () => {
  it("should throw error when start step doesn't exist", () => {
    const flow: FlowDefinition<FlowContext> = {
      id: "test",
      start: "missing",
      steps: {
        first: {},
      },
    };

    expect(() => validateFlowDefinition(flow)).toThrow(
      'Start step "missing" does not exist in steps',
    );
  });

  it("should throw error when string next references non-existent step", () => {
    const flow: FlowDefinition<FlowContext> = {
      id: "test",
      start: "first",
      steps: {
        first: { next: "missing" },
        second: {},
      },
    };

    expect(() => validateFlowDefinition(flow)).toThrow(
      'Step "first" references non-existent step "missing"',
    );
  });

  it("should throw error when array next references non-existent step", () => {
    const flow: FlowDefinition<FlowContext> = {
      id: "test",
      start: "first",
      steps: {
        first: { next: ["second", "missing"] },
        second: {},
      },
    };

    expect(() => validateFlowDefinition(flow)).toThrow(
      'Step "first" references non-existent step "missing"',
    );
  });

  it("should not throw for valid flow definition", () => {
    const flow: FlowDefinition<FlowContext> = {
      id: "test",
      start: "first",
      steps: {
        first: { next: "second" },
        second: { next: ["third", "fourth"] },
        third: {},
        fourth: {},
      },
    };

    expect(() => validateFlowDefinition(flow)).not.toThrow();
  });

  it("should not validate function returns (can't check statically)", () => {
    const flow: FlowDefinition<FlowContext> = {
      id: "test",
      start: "first",
      steps: {
        first: { next: () => "missing" }, // Can't validate this
        second: {},
      },
    };

    // Should not throw - function returns can't be validated statically
    expect(() => validateFlowDefinition(flow)).not.toThrow();
  });

  it("should throw multiple errors at once", () => {
    const flow: FlowDefinition<FlowContext> = {
      id: "test",
      start: "missing",
      steps: {
        first: { next: "also-missing" },
        second: { next: ["third", "another-missing"] },
      },
    };

    expect(() => validateFlowDefinition(flow)).toThrow("missing");
    expect(() => validateFlowDefinition(flow)).toThrow("also-missing");
    expect(() => validateFlowDefinition(flow)).toThrow("another-missing");
  });
});
