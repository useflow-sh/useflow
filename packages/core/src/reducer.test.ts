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
    expect(state.path).toEqual([
      { stepId: "idle", startedAt: expect.any(Number) },
    ]);
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
    expect(state.path).toEqual([
      {
        stepId: "first",
        startedAt: expect.any(Number),
        completedAt: expect.any(Number),
        action: "next",
      },
      { stepId: "second", startedAt: expect.any(Number) },
    ]);

    state = flowReducer(state, { type: "NEXT" }, definition);
    expect(state.stepId).toBe("third");
    expect(state.path).toEqual([
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
    expect(state.path).toEqual([
      {
        stepId: "first",
        startedAt: expect.any(Number),
        completedAt: expect.any(Number),
        action: "next",
      },
      { stepId: "second", startedAt: expect.any(Number) },
    ]);

    state = flowReducer(state, { type: "BACK" }, definition);
    expect(state.stepId).toBe("first");
    expect(state.path).toEqual([
      { stepId: "first", startedAt: expect.any(Number) },
    ]);
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
    expect(state.path).toEqual([
      { stepId: "first", startedAt: expect.any(Number) },
    ]);
  });

  it("should skip to next step and mark action as skip", () => {
    type TestContext = { skipped: boolean };

    const definition: FlowDefinition<TestContext> = {
      id: "test",
      start: "first",
      steps: {
        first: { next: "second" },
        second: { next: "third" },
        third: {},
      },
    };

    let state = createInitialState(definition, { skipped: false });
    expect(state.stepId).toBe("first");

    // Skip first step
    state = flowReducer(state, { type: "SKIP" }, definition);
    expect(state.stepId).toBe("second");
    expect(state.path).toEqual([
      {
        stepId: "first",
        startedAt: expect.any(Number),
        completedAt: expect.any(Number),
        action: "skip",
      },
      { stepId: "second", startedAt: expect.any(Number) },
    ]);
    expect(state.history).toEqual([
      {
        stepId: "first",
        startedAt: expect.any(Number),
        completedAt: expect.any(Number),
        action: "skip",
      },
      { stepId: "second", startedAt: expect.any(Number) },
    ]);

    // Navigate normally to third
    state = flowReducer(state, { type: "NEXT" }, definition);
    expect(state.stepId).toBe("third");
    expect(state.path).toEqual([
      {
        stepId: "first",
        startedAt: expect.any(Number),
        completedAt: expect.any(Number),
        action: "skip",
      },
      {
        stepId: "second",
        startedAt: expect.any(Number),
        completedAt: expect.any(Number),
        action: "next",
      },
      { stepId: "third", startedAt: expect.any(Number) },
    ]);
  });

  it("should update context and skip with SKIP action", () => {
    type TestContext = { name: string; skippedPreferences: boolean };

    const definition: FlowDefinition<TestContext> = {
      id: "test",
      start: "profile",
      steps: {
        profile: { next: "preferences" },
        preferences: { next: "complete" },
        complete: {},
      },
    };

    let state = createInitialState(definition, {
      name: "",
      skippedPreferences: false,
    });

    // Navigate to preferences
    state = flowReducer(
      state,
      { type: "NEXT", update: { name: "Alice" } },
      definition,
    );
    expect(state.stepId).toBe("preferences");

    // Skip preferences with context update
    state = flowReducer(
      state,
      { type: "SKIP", update: { skippedPreferences: true } },
      definition,
    );

    expect(state.stepId).toBe("complete");
    expect(state.context).toEqual({ name: "Alice", skippedPreferences: true });
    expect(state.history[1]).toEqual({
      stepId: "preferences",
      startedAt: expect.any(Number),
      completedAt: expect.any(Number),
      action: "skip",
    });
  });

  it("should skip with explicit target step", () => {
    type TestContext = { choice: string };

    const definition: FlowDefinition<TestContext> = {
      id: "test",
      start: "intro",
      steps: {
        intro: { next: ["path-a", "path-b"] },
        "path-a": { next: "complete" },
        "path-b": { next: "complete" },
        complete: {},
      },
    };

    let state = createInitialState(definition, { choice: "" });

    // Skip intro and explicitly go to path-b
    state = flowReducer(
      state,
      { type: "SKIP", target: "path-b", update: { choice: "b" } },
      definition,
    );

    expect(state.stepId).toBe("path-b");
    expect(state.context.choice).toBe("b");
    expect(state.history[0]).toEqual({
      stepId: "intro",
      startedAt: expect.any(Number),
      completedAt: expect.any(Number),
      action: "skip",
    });
  });

  it("should skip with resolver function for context-driven branching", () => {
    type TestContext = { isPremium: boolean };

    const definition: FlowDefinition<TestContext> = {
      id: "test",
      start: "onboarding",
      steps: {
        onboarding: { next: ["premium", "standard"] },
        premium: {},
        standard: {},
      },
    };

    const resolvers = {
      onboarding: (ctx: TestContext) =>
        ctx.isPremium ? "premium" : "standard",
    };

    let state = createInitialState(definition, { isPremium: true });
    state = flowReducer(state, { type: "SKIP" }, definition, { resolvers });

    expect(state.stepId).toBe("premium");
    expect(state.history[0]).toMatchObject({
      stepId: "onboarding",
      action: "skip",
    });

    // Test with isPremium: false
    state = createInitialState(definition, { isPremium: false });
    state = flowReducer(state, { type: "SKIP" }, definition, { resolvers });

    expect(state.stepId).toBe("standard");
  });

  it("should throw when skip has array next but no resolver and no target", () => {
    type TestContext = { value: string };

    const definition: FlowDefinition<TestContext> = {
      id: "test",
      start: "menu",
      steps: {
        menu: { next: ["option1", "option2"] },
        option1: {},
        option2: {},
      },
    };

    const state = createInitialState(definition, { value: "" });

    expect(() => {
      flowReducer(state, { type: "SKIP" }, definition);
    }).toThrow(
      "Step \"menu\" has multiple next steps [option1, option2] but no resolver function. Component must call skip() with explicit target: skip('option1') or skip('option2')",
    );
  });

  it("should warn and stay on step when skip target is invalid", () => {
    type TestContext = { value: string };
    const consoleWarnSpy = vi
      .spyOn(console, "warn")
      .mockImplementation(() => {});

    const definition: FlowDefinition<TestContext> = {
      id: "test",
      start: "first",
      steps: {
        first: { next: "second" },
        second: {},
      },
    };

    let state = createInitialState(definition, { value: "test" });
    state = flowReducer(state, { type: "SKIP", target: "invalid" }, definition);

    expect(state.stepId).toBe("first"); // Should stay on current step
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Invalid target "invalid" from step "first". Allowed: second',
    );

    consoleWarnSpy.mockRestore();
  });

  it("should throw when skip resolver returns invalid step", () => {
    type TestContext = { choice: string };

    const definition: FlowDefinition<TestContext> = {
      id: "test",
      start: "menu",
      steps: {
        menu: { next: ["option1", "option2"] },
        option1: {},
        option2: {},
      },
    };

    const badResolvers = {
      menu: () => "invalid-step", // Returns step not in next array
    };

    const state = createInitialState(definition, { choice: "" });

    expect(() => {
      flowReducer(state, { type: "SKIP" }, definition, {
        resolvers: badResolvers,
      });
    }).toThrow(
      'resolver() returned "invalid-step" which is not in next array: [option1, option2] for step "menu"',
    );
  });

  it("should skip on final step and mark as complete", () => {
    type TestContext = { value: string };

    const definition: FlowDefinition<TestContext> = {
      id: "test",
      start: "final",
      steps: {
        final: {}, // No next step
      },
    };

    let state = createInitialState(definition, { value: "test" });
    state = flowReducer(state, { type: "SKIP" }, definition);

    expect(state.status).toBe("complete");
    expect(state.stepId).toBe("final");
  });

  it("should stay on step when skip resolver returns undefined", () => {
    type TestContext = { shouldSkip: boolean };

    const definition: FlowDefinition<TestContext> = {
      id: "test",
      start: "conditional",
      steps: {
        conditional: { next: ["next-step"] },
        "next-step": {},
      },
    };

    const resolvers = {
      conditional: (ctx: TestContext) =>
        ctx.shouldSkip ? undefined : "next-step",
    };

    let state = createInitialState(definition, { shouldSkip: true });
    state = flowReducer(state, { type: "SKIP" }, definition, { resolvers });

    expect(state.stepId).toBe("conditional"); // Should stay on current step
  });

  it("should warn when skip target doesn't match string next", () => {
    type TestContext = { value: string };
    const consoleWarnSpy = vi
      .spyOn(console, "warn")
      .mockImplementation(() => {});

    const definition: FlowDefinition<TestContext> = {
      id: "test",
      start: "first",
      steps: {
        first: { next: "second" },
        second: {},
        third: {},
      },
    };

    let state = createInitialState(definition, { value: "test" });
    state = flowReducer(
      state,
      { type: "SKIP", target: "third" }, // Target doesn't match the single string next
      definition,
    );

    expect(state.stepId).toBe("first"); // Should stay on current step
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Invalid target "third" from step "first". Allowed: second',
    );

    consoleWarnSpy.mockRestore();
  });

  it("should warn when skip target not in array next", () => {
    type TestContext = { value: string };
    const consoleWarnSpy = vi
      .spyOn(console, "warn")
      .mockImplementation(() => {});

    const definition: FlowDefinition<TestContext> = {
      id: "test",
      start: "menu",
      steps: {
        menu: { next: ["option1", "option2"] },
        option1: {},
        option2: {},
        option3: {},
      },
    };

    let state = createInitialState(definition, { value: "test" });
    state = flowReducer(
      state,
      { type: "SKIP", target: "option3" }, // Not in the array
      definition,
    );

    expect(state.stepId).toBe("menu"); // Should stay on current step
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Invalid target "option3" from step "menu". Allowed: option1, option2',
    );

    consoleWarnSpy.mockRestore();
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

  it("should support context-driven branching with resolve", () => {
    type TestContext = { isBusiness: boolean };

    const definition: FlowDefinition<TestContext> = {
      id: "test",
      start: "profile",
      steps: {
        profile: {
          next: ["business", "personal"],
        },
        business: {},
        personal: {},
      },
    };

    const resolvers = {
      profile: (ctx: TestContext) => (ctx.isBusiness ? "business" : "personal"),
    };

    let state = createInitialState(definition, { isBusiness: true });
    state = flowReducer(state, { type: "NEXT" }, definition, { resolvers });
    expect(state.stepId).toBe("business");
    expect(state.status).toBe("complete"); // Final step

    state = createInitialState(definition, { isBusiness: false });
    state = flowReducer(state, { type: "NEXT" }, definition, { resolvers });
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

  it("should stay on current step if resolve returns undefined", () => {
    type TestContext = { isValid: boolean };

    const definition: FlowDefinition<TestContext> = {
      id: "test",
      start: "form",
      steps: {
        form: {
          next: ["complete"],
        },
        complete: {},
      },
    };

    const resolvers = {
      form: (ctx: TestContext) => (ctx.isValid ? "complete" : undefined),
    };

    let state = createInitialState(definition, { isValid: false });
    state = flowReducer(state, { type: "NEXT" }, definition, { resolvers });

    expect(state.stepId).toBe("form");
    expect(state.path).toEqual([
      { stepId: "form", startedAt: expect.any(Number) },
    ]);

    state = flowReducer(
      state,
      { type: "SET_CONTEXT", update: { isValid: true } },
      definition,
      { resolvers },
    );
    state = flowReducer(state, { type: "NEXT" }, definition, { resolvers });

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

  it("should support updater function with context-driven navigation", () => {
    type TestContext = { score: number };

    const definition: FlowDefinition<TestContext> = {
      id: "test",
      start: "game",
      steps: {
        game: {
          next: ["win", "lose"],
        },
        win: {},
        lose: {},
      },
    };

    const resolvers = {
      game: (ctx: TestContext) => (ctx.score >= 100 ? "win" : "lose"),
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
      { resolvers },
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
      { resolvers },
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

  it("should throw when array next has no resolve and no explicit target", () => {
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

    // Navigate without target or resolve - should throw
    const action: FlowAction<FlowContext> = { type: "NEXT" };

    expect(() => flowReducer(state, action, flow)).toThrow(
      'Step "choice" has multiple next steps',
    );
    expect(() => flowReducer(state, action, flow)).toThrow(
      "but no resolver function",
    );
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
    expect(state.path).toEqual([
      {
        stepId: "start",
        startedAt: expect.any(Number),
        completedAt: expect.any(Number),
        action: "next",
      },
      {
        stepId: "pathA",
        startedAt: expect.any(Number),
        completedAt: expect.any(Number),
        action: "next",
      },
      { stepId: "end2", startedAt: expect.any(Number) },
    ]);
  });

  it("should combine context-driven and component-driven navigation", () => {
    type TestContext = {
      userType?: "business" | "personal";
      setupChoice?: string;
    };

    const flow: FlowDefinition<TestContext> = {
      id: "test",
      start: "userType",
      steps: {
        userType: {
          // Context-driven branching
          next: ["businessSetup", "setup"],
        },
        businessSetup: {
          next: "setup",
        },
        setup: {
          // Component-driven navigation
          next: ["advanced", "quick"],
        },
        advanced: {},
        quick: {},
      },
    };

    const resolvers = {
      userType: (ctx: TestContext) =>
        ctx.userType === "business" ? "businessSetup" : "setup",
    };

    let state = createInitialState<TestContext>(flow, {});

    // Context-driven: navigate as business
    state = flowReducer(
      state,
      { type: "NEXT", update: (ctx) => ({ ...ctx, userType: "business" }) },
      flow,
      { resolvers },
    );
    expect(state.stepId).toBe("businessSetup");

    // Continue to setup
    state = flowReducer(state, { type: "NEXT" }, flow, { resolvers });
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
      { resolvers },
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

  it("should validate target against next array", () => {
    type TestContext = { userType: "business" | "personal" };

    const flow: FlowDefinition<TestContext> = {
      id: "test",
      start: "profile",
      steps: {
        profile: {
          next: ["business", "personal"],
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

    // Valid target: in next array
    const validAction: FlowAction<TestContext> = {
      type: "NEXT",
      target: "business",
    };

    const validState = flowReducer(state, validAction, flow);
    expect(validState.stepId).toBe("business");

    // Invalid target: not in next array
    const invalidAction: FlowAction<TestContext> = {
      type: "NEXT",
      target: "other", // Not in next array
    };

    const invalidState = flowReducer(state, invalidAction, flow);
    expect(invalidState.stepId).toBe("profile"); // Should stay on current step
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Invalid target "other"'),
    );

    consoleSpy.mockRestore();
  });

  it("should allow explicit target even with resolve function", () => {
    type TestContext = { score: number };

    const flow: FlowDefinition<TestContext> = {
      id: "test",
      start: "game",
      steps: {
        game: {
          next: ["win", "lose"],
        },
        win: {},
        lose: {},
      },
    };

    const resolvers = {
      game: (ctx: TestContext) => (ctx.score >= 100 ? "win" : "lose"),
    };

    const state = createInitialState(flow, { score: 50 });

    // Even though resolve would return "lose", explicit target should work
    const action: FlowAction<TestContext> = {
      type: "NEXT",
      target: "win",
    };

    const newState = flowReducer(state, action, flow, { resolvers });
    expect(newState.stepId).toBe("win"); // Should use explicit target
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

  it("should not validate resolve returns (can't check statically)", () => {
    const flow: FlowDefinition<FlowContext> = {
      id: "test",
      start: "first",
      steps: {
        first: {
          next: ["second"],
        },
        second: {},
      },
    };

    // Should not throw - resolve returns can't be validated statically
    // (resolvers are validated at runtime)
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

describe("RESET action", () => {
  it("should reset flow to initial state", () => {
    type TestContext = { count: number; name: string };

    const definition: FlowDefinition<TestContext> = {
      id: "test",
      start: "first",
      steps: {
        first: { next: "second" },
        second: { next: "third" },
        third: {},
      },
    };

    const initialContext: TestContext = { count: 0, name: "initial" };
    let state = createInitialState(definition, initialContext);

    // Navigate forward and modify context
    state = flowReducer(
      state,
      { type: "NEXT", update: { count: 1, name: "updated" } },
      definition,
    );
    expect(state.stepId).toBe("second");
    expect(state.context).toEqual({ count: 1, name: "updated" });
    expect(state.path).toEqual([
      {
        stepId: "first",
        startedAt: expect.any(Number),
        completedAt: expect.any(Number),
        action: "next",
      },
      { stepId: "second", startedAt: expect.any(Number) },
    ]);

    state = flowReducer(state, { type: "NEXT" }, definition);
    expect(state.stepId).toBe("third");
    expect(state.path).toEqual([
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

    // Reset should go back to initial state
    state = flowReducer(state, { type: "RESET", initialContext }, definition);

    expect(state.stepId).toBe("first");
    expect(state.context).toEqual({ count: 0, name: "initial" });
    expect(state.path).toEqual([
      { stepId: "first", startedAt: expect.any(Number) },
    ]);
    expect(state.status).toBe("active");
  });

  it("should reset from completed state", () => {
    type TestContext = { value: string };

    const definition: FlowDefinition<TestContext> = {
      id: "test",
      start: "first",
      steps: {
        first: { next: "last" },
        last: {}, // Terminal step
      },
    };

    const initialContext: TestContext = { value: "start" };
    let state = createInitialState(definition, initialContext);

    // Complete the flow
    state = flowReducer(
      state,
      { type: "NEXT", update: { value: "modified" } },
      definition,
    );
    expect(state.stepId).toBe("last");
    expect(state.status).toBe("complete");
    expect(state.context.value).toBe("modified");

    // Reset from completed state
    state = flowReducer(state, { type: "RESET", initialContext }, definition);

    expect(state.stepId).toBe("first");
    expect(state.status).toBe("active");
    expect(state.context.value).toBe("start");
    expect(state.path).toEqual([
      { stepId: "first", startedAt: expect.any(Number) },
    ]);
  });

  it("should reset context to provided initial context, not current context", () => {
    type TestContext = { counter: number };

    const definition: FlowDefinition<TestContext> = {
      id: "test",
      start: "step1",
      steps: {
        step1: { next: "step2" },
        step2: {},
      },
    };

    const initialContext: TestContext = { counter: 0 };
    let state = createInitialState(definition, initialContext);

    // Modify context multiple times
    state = flowReducer(
      state,
      { type: "SET_CONTEXT", update: { counter: 10 } },
      definition,
    );
    state = flowReducer(state, { type: "NEXT" }, definition);
    state = flowReducer(
      state,
      { type: "SET_CONTEXT", update: { counter: 20 } },
      definition,
    );

    expect(state.context.counter).toBe(20);

    // Reset should use initial context (0), not current context (20)
    state = flowReducer(state, { type: "RESET", initialContext }, definition);

    expect(state.context.counter).toBe(0);
    expect(state.stepId).toBe("step1");
  });

  it("should allow navigation after reset", () => {
    type TestContext = { step: number };

    const definition: FlowDefinition<TestContext> = {
      id: "test",
      start: "a",
      steps: {
        a: { next: "b" },
        b: { next: "c" },
        c: {},
      },
    };

    const initialContext: TestContext = { step: 0 };
    let state = createInitialState(definition, initialContext);

    // Navigate through flow
    state = flowReducer(state, { type: "NEXT" }, definition);
    state = flowReducer(state, { type: "NEXT" }, definition);
    expect(state.stepId).toBe("c");

    // Reset
    state = flowReducer(state, { type: "RESET", initialContext }, definition);
    expect(state.stepId).toBe("a");

    // Should be able to navigate again
    state = flowReducer(
      state,
      { type: "NEXT", update: { step: 1 } },
      definition,
    );
    expect(state.stepId).toBe("b");
    expect(state.context.step).toBe(1);
    expect(state.path).toEqual([
      {
        stepId: "a",
        startedAt: expect.any(Number),
        completedAt: expect.any(Number),
        action: "next",
      },
      { stepId: "b", startedAt: expect.any(Number) },
    ]);
  });
});

describe("resolve property", () => {
  it("should validate that resolve returns value from next array", () => {
    type TestContext = { choice: string };

    const flow: FlowDefinition<TestContext> = {
      id: "test",
      start: "choice",
      steps: {
        choice: {
          next: ["optionA", "optionB"],
        },
        optionA: {},
        optionB: {},
        invalidOption: {},
      },
    };

    const resolvers = {
      choice: () => "invalidOption", // Not in next array
    };

    const state = createInitialState<TestContext>(flow, { choice: "" });

    expect(() =>
      flowReducer(state, { type: "NEXT" }, flow, { resolvers }),
    ).toThrow(
      'resolver() returned "invalidOption" which is not in next array: [optionA, optionB] for step "choice"',
    );
  });

  it("should use resolve when no explicit target provided", () => {
    type TestContext = { userType: "business" | "personal" };

    const flow: FlowDefinition<TestContext> = {
      id: "test",
      start: "choice",
      steps: {
        choice: {
          next: ["business", "personal"],
        },
        business: {},
        personal: {},
      },
    };

    const resolvers = {
      choice: (ctx: TestContext) => ctx.userType,
    };

    let state = createInitialState<TestContext>(flow, { userType: "business" });
    state = flowReducer(state, { type: "NEXT" }, flow, { resolvers });
    expect(state.stepId).toBe("business");

    state = createInitialState<TestContext>(flow, { userType: "personal" });
    state = flowReducer(state, { type: "NEXT" }, flow, { resolvers });
    expect(state.stepId).toBe("personal");
  });

  it("should allow explicit target to override resolve", () => {
    type TestContext = { score: number };

    const flow: FlowDefinition<TestContext> = {
      id: "test",
      start: "game",
      steps: {
        game: {
          next: ["win", "lose"],
        },
        win: {},
        lose: {},
      },
    };

    const resolvers = {
      game: (ctx: TestContext) => (ctx.score >= 100 ? "win" : "lose"),
    };

    const state = createInitialState<TestContext>(flow, { score: 50 });

    // resolve would return "lose", but explicit target overrides it
    const newState = flowReducer(state, { type: "NEXT", target: "win" }, flow, {
      resolvers,
    });
    expect(newState.stepId).toBe("win");
  });

  it("should stay on step when resolve returns undefined", () => {
    type TestContext = { ready: boolean };

    const flow: FlowDefinition<TestContext> = {
      id: "test",
      start: "waiting",
      steps: {
        waiting: {
          next: ["complete"],
        },
        complete: {},
      },
    };

    const resolvers = {
      waiting: (ctx: TestContext) => (ctx.ready ? "complete" : undefined),
    };

    let state = createInitialState<TestContext>(flow, { ready: false });
    state = flowReducer(state, { type: "NEXT" }, flow, { resolvers });
    expect(state.stepId).toBe("waiting"); // Should stay on same step

    // When ready is true, should navigate
    state = flowReducer(
      state,
      { type: "SET_CONTEXT", update: { ready: true } },
      flow,
      { resolvers },
    );
    state = flowReducer(state, { type: "NEXT" }, flow, { resolvers });
    expect(state.stepId).toBe("complete");
  });

  it("should use resolve with context updates during NEXT", () => {
    type TestContext = { status: string };

    const flow: FlowDefinition<TestContext> = {
      id: "test",
      start: "start",
      steps: {
        start: {
          next: ["active", "inactive"],
        },
        active: {},
        inactive: {},
      },
    };

    const resolvers = {
      start: (ctx: TestContext) =>
        ctx.status === "ready" ? "active" : "inactive",
    };

    let state = createInitialState<TestContext>(flow, { status: "pending" });

    // Update context and navigate in one action - resolve should see updated context
    state = flowReducer(
      state,
      { type: "NEXT", update: { status: "ready" } },
      flow,
      { resolvers },
    );
    expect(state.stepId).toBe("active");
    expect(state.context.status).toBe("ready");
  });
});

describe("Flow timestamps", () => {
  it("should set startedAt when flow is initialized", () => {
    type TestContext = { value: string };

    const definition: FlowDefinition<TestContext> = {
      id: "test",
      start: "first",
      steps: {
        first: { next: "second" },
        second: {},
      },
    };

    const beforeTime = Date.now();
    const state = createInitialState(definition, { value: "test" });
    const afterTime = Date.now();

    expect(state.startedAt).toBeGreaterThanOrEqual(beforeTime);
    expect(state.startedAt).toBeLessThanOrEqual(afterTime);
    expect(state.completedAt).toBeUndefined();
  });

  it("should set completedAt when flow reaches final step via NEXT", () => {
    type TestContext = { value: string };

    const definition: FlowDefinition<TestContext> = {
      id: "test",
      start: "first",
      steps: {
        first: { next: "second" },
        second: {},
      },
    };

    let state = createInitialState(definition, { value: "test" });
    const startedAt = state.startedAt;

    // Navigate to second step
    const beforeComplete = Date.now();
    state = flowReducer(state, { type: "NEXT" }, definition);
    const afterComplete = Date.now();

    expect(state.status).toBe("complete");
    expect(state.completedAt).toBeGreaterThanOrEqual(beforeComplete);
    expect(state.completedAt).toBeLessThanOrEqual(afterComplete);
    expect(state.startedAt).toBe(startedAt); // Should preserve original start time
  });

  it("should set completedAt when flow reaches final step via SKIP", () => {
    type TestContext = { value: string };

    const definition: FlowDefinition<TestContext> = {
      id: "test",
      start: "first",
      steps: {
        first: { next: "second" },
        second: {},
      },
    };

    let state = createInitialState(definition, { value: "test" });
    const startedAt = state.startedAt;

    // Skip to second step
    const beforeComplete = Date.now();
    state = flowReducer(state, { type: "SKIP" }, definition);
    const afterComplete = Date.now();

    expect(state.status).toBe("complete");
    expect(state.completedAt).toBeGreaterThanOrEqual(beforeComplete);
    expect(state.completedAt).toBeLessThanOrEqual(afterComplete);
    expect(state.startedAt).toBe(startedAt); // Should preserve original start time
  });

  it("should set completedAt when navigating to final step from intermediate step", () => {
    type TestContext = { value: string };

    const definition: FlowDefinition<TestContext> = {
      id: "test",
      start: "first",
      steps: {
        first: { next: "second" },
        second: { next: "third" },
        third: {},
      },
    };

    let state = createInitialState(definition, { value: "test" });
    const startedAt = state.startedAt;

    // Navigate to second
    state = flowReducer(state, { type: "NEXT" }, definition);
    expect(state.status).toBe("active");
    expect(state.completedAt).toBeUndefined();

    // Navigate to third (final)
    const beforeComplete = Date.now();
    state = flowReducer(state, { type: "NEXT" }, definition);
    const afterComplete = Date.now();

    expect(state.status).toBe("complete");
    expect(state.completedAt).toBeGreaterThanOrEqual(beforeComplete);
    expect(state.completedAt).toBeLessThanOrEqual(afterComplete);
    expect(state.startedAt).toBe(startedAt); // Should preserve original start time
  });

  it("should preserve timestamps when navigating back", () => {
    type TestContext = { value: string };

    const definition: FlowDefinition<TestContext> = {
      id: "test",
      start: "first",
      steps: {
        first: { next: "second" },
        second: {},
      },
    };

    let state = createInitialState(definition, { value: "test" });
    const startedAt = state.startedAt;

    // Navigate forward
    state = flowReducer(state, { type: "NEXT" }, definition);

    // Navigate back
    state = flowReducer(state, { type: "BACK" }, definition);

    expect(state.startedAt).toBe(startedAt); // Should preserve original start time
    expect(state.completedAt).toBeUndefined(); // Should clear completed time when going back
    expect(state.status).toBe("active");
  });

  it("should reset timestamps when flow is reset", () => {
    type TestContext = { value: string };

    const definition: FlowDefinition<TestContext> = {
      id: "test",
      start: "first",
      steps: {
        first: { next: "second" },
        second: {},
      },
    };

    let state = createInitialState(definition, { value: "test" });
    const originalStartedAt = state.startedAt;

    // Navigate to completion
    state = flowReducer(state, { type: "NEXT" }, definition);
    expect(state.status).toBe("complete");
    expect(state.completedAt).toBeDefined();

    // Reset the flow
    const beforeReset = Date.now();
    state = flowReducer(
      state,
      { type: "RESET", initialContext: { value: "reset" } },
      definition,
    );
    const afterReset = Date.now();

    expect(state.status).toBe("active");
    expect(state.completedAt).toBeUndefined();
    expect(state.startedAt).toBeGreaterThanOrEqual(beforeReset);
    expect(state.startedAt).toBeLessThanOrEqual(afterReset);
    // Start time should be greater than or equal to original (new timestamp)
    expect(state.startedAt).toBeGreaterThanOrEqual(originalStartedAt);
  });

  it("should calculate flow duration from timestamps", () => {
    type TestContext = { value: string };

    const definition: FlowDefinition<TestContext> = {
      id: "test",
      start: "first",
      steps: {
        first: { next: "second" },
        second: {},
      },
    };

    let state = createInitialState(definition, { value: "test" });
    const startTime = state.startedAt;

    // Navigate to completion
    state = flowReducer(state, { type: "NEXT" }, definition);

    const duration = state.completedAt! - state.startedAt;
    expect(duration).toBeGreaterThanOrEqual(0);
    expect(state.completedAt).toBeGreaterThanOrEqual(state.startedAt);
    expect(state.startedAt).toBe(startTime); // Preserved from init
  });

  it("should calculate flow duration from timestamps", () => {
    type TestContext = { value: string };

    const definition: FlowDefinition<TestContext> = {
      id: "test",
      start: "first",
      steps: {
        first: { next: "second" },
        second: {},
      },
    };

    let state = createInitialState(definition, { value: "test" });

    // Add a small delay
    const delay = 10;
    const wait = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    // Navigate to completion with delay
    wait(delay).then(() => {
      state = flowReducer(state, { type: "NEXT" }, definition);

      const duration = state.completedAt! - state.startedAt;
      expect(duration).toBeGreaterThanOrEqual(delay);
      expect(state.completedAt).toBeGreaterThan(state.startedAt);
    });
  });
});
