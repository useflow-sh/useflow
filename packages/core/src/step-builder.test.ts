import { describe, expect, it } from "vitest";
import { step } from "./step-builder";

/**
 * Tests for the step() helper function
 *
 * The step() helper provides compile-time type safety for resolve functions.
 * These tests verify both runtime behavior and type-level constraints.
 */
describe("step()", () => {
  type TestContext = {
    userType: "business" | "personal";
    choice?: "optionA" | "optionB";
  };

  it("should create a step with next and resolve", () => {
    const userTypeStep = step({
      next: ["stepA", "stepB"],
      resolve: (ctx: TestContext) =>
        ctx.userType === "business" ? "stepA" : "stepB",
    });

    expect(userTypeStep).toBeDefined();
    expect(userTypeStep.next).toEqual(["stepA", "stepB"]);
    expect(userTypeStep.resolve).toBeTypeOf("function");
  });

  it("should allow resolve to return undefined", () => {
    const stepWithUndefined = step({
      next: ["stepA", "stepB"],
      resolve: (ctx: TestContext) => {
        if (ctx.userType === "business") return "stepA";
        if (ctx.userType === "personal") return "stepB";
        return undefined; // Stay on current step
      },
    });

    expect(stepWithUndefined.resolve?.({ userType: "business" })).toBe("stepA");
    expect(stepWithUndefined.resolve?.({ userType: "personal" })).toBe("stepB");
    expect(stepWithUndefined.resolve?.({} as TestContext)).toBeUndefined();
  });

  it("should support additional properties", () => {
    const stepWithLabel = step({
      next: ["stepA", "stepB"],
      resolve: (ctx: TestContext) =>
        ctx.userType === "business" ? "stepA" : "stepB",
      label: "Choose your account type",
      metadata: { analytics: "user-type-selection" },
      icon: "user",
    });

    expect(stepWithLabel.label).toBe("Choose your account type");
    expect(stepWithLabel.metadata).toEqual({
      analytics: "user-type-selection",
    });
    expect(stepWithLabel.icon).toBe("user");
  });

  it("should work in a complete flow definition", () => {
    const flow = {
      id: "test-flow",
      start: "welcome",
      steps: {
        welcome: step({
          next: ["stepA", "stepB"],
          resolve: (ctx: TestContext) =>
            ctx.userType === "business" ? "stepA" : "stepB",
        }),
        stepA: {
          next: "complete",
        },
        stepB: {
          next: "complete",
        },
        complete: {},
      },
    };

    expect(flow).toBeDefined();
    expect(flow.steps.welcome.resolve).toBeTypeOf("function");
    expect(flow.steps.welcome.resolve?.({ userType: "business" })).toBe(
      "stepA",
    );
    expect(flow.steps.welcome.resolve?.({ userType: "personal" })).toBe(
      "stepB",
    );
  });

  it("should handle multiple branching steps in same flow", () => {
    const flow = {
      id: "multi-branch",
      start: "step1",
      steps: {
        step1: step({
          next: ["step2a", "step2b"],
          resolve: (ctx: TestContext) =>
            ctx.userType === "business" ? "step2a" : "step2b",
        }),
        step2a: step({
          next: ["step3x", "step3y"],
          resolve: (ctx: TestContext) =>
            ctx.choice === "optionA" ? "step3x" : "step3y",
        }),
        step2b: {
          next: "complete",
        },
        step3x: {
          next: "complete",
        },
        step3y: {
          next: "complete",
        },
        complete: {},
      },
    };

    expect(flow).toBeDefined();
    expect(flow.steps.step1.resolve).toBeTypeOf("function");
    expect(flow.steps.step2a.resolve).toBeTypeOf("function");

    // Test runtime behavior
    expect(flow.steps.step1.resolve?.({ userType: "business" })).toBe("step2a");
    expect(flow.steps.step1.resolve?.({ userType: "personal" })).toBe("step2b");
    expect(
      flow.steps.step2a.resolve?.({ userType: "business", choice: "optionA" }),
    ).toBe("step3x");
    expect(
      flow.steps.step2a.resolve?.({ userType: "business", choice: "optionB" }),
    ).toBe("step3y");
  });

  it("should preserve the config object (identity function)", () => {
    const config = {
      next: ["stepA", "stepB"],
      resolve: (ctx: TestContext) =>
        ctx.userType === "business" ? "stepA" : "stepB",
      customProp: "test",
    };

    const result = step(config);

    // Should return the exact same object
    expect(result).toBe(config);
  });
});
