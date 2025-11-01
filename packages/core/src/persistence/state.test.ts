import { describe, expect, it } from "vitest";
import type { FlowDefinition, PersistedFlowState } from "../types";
import { validatePersistedState } from "./state";

describe("validatePersistedState", () => {
  const definition: FlowDefinition<{ name: string }> = {
    id: "test-flow",
    start: "welcome",
    steps: {
      welcome: { next: "profile" },
      profile: { next: "complete" },
      complete: {},
    },
  };

  it("should validate valid state", () => {
    const persisted: PersistedFlowState<{ name: string }> = {
      stepId: "profile",
      context: { name: "John" },
      history: ["welcome", "profile"],
      status: "active",
    };

    const result = validatePersistedState(persisted, definition);

    expect(result.valid).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  it("should reject state with invalid stepId", () => {
    const persisted: PersistedFlowState<{ name: string }> = {
      stepId: "invalid",
      context: { name: "John" },
      history: ["welcome", "invalid"],
      status: "active",
    };

    const result = validatePersistedState(persisted, definition);

    expect(result.valid).toBe(false);
    expect(
      result.errors?.some((e) =>
        e.includes('Current step "invalid" not found'),
      ),
    ).toBe(true);
  });

  it("should reject state with empty history", () => {
    const persisted: PersistedFlowState<{ name: string }> = {
      stepId: "profile",
      context: { name: "John" },
      history: [],
      status: "active",
    };

    const result = validatePersistedState(persisted, definition);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("History cannot be empty");
  });

  it("should reject state with wrong start step in history", () => {
    const persisted: PersistedFlowState<{ name: string }> = {
      stepId: "profile",
      context: { name: "John" },
      history: ["profile"],
      status: "active",
    };

    const result = validatePersistedState(persisted, definition);

    expect(result.valid).toBe(false);
    expect(
      result.errors?.some((e) =>
        e.includes('History must start with "welcome"'),
      ),
    ).toBe(true);
  });

  it("should reject state with invalid step in history", () => {
    const persisted: PersistedFlowState<{ name: string }> = {
      stepId: "profile",
      context: { name: "John" },
      history: ["welcome", "invalid", "profile"],
      status: "active",
    };

    const result = validatePersistedState(persisted, definition);

    expect(result.valid).toBe(false);
    expect(
      result.errors?.some((e) =>
        e.includes('History contains non-existent step "invalid"'),
      ),
    ).toBe(true);
  });

  it("should reject state where stepId doesn't match last history item", () => {
    const persisted: PersistedFlowState<{ name: string }> = {
      stepId: "complete",
      context: { name: "John" },
      history: ["welcome", "profile"],
      status: "active",
    };

    const result = validatePersistedState(persisted, definition);

    expect(result.valid).toBe(false);
    expect(
      result.errors?.some((e) =>
        e.includes(
          'Current stepId "complete" must match last item in history "profile"',
        ),
      ),
    ).toBe(true);
  });

  it("should reject state with incorrect status", () => {
    const persisted: PersistedFlowState<{ name: string }> = {
      stepId: "complete",
      context: { name: "John" },
      history: ["welcome", "profile", "complete"],
      status: "active",
    };

    const result = validatePersistedState(persisted, definition);

    expect(result.valid).toBe(false);
    expect(
      result.errors?.some((e) =>
        e.includes('Status "active" doesn\'t match expected "complete"'),
      ),
    ).toBe(true);
  });

  it("should validate complete status correctly", () => {
    const persisted: PersistedFlowState<{ name: string }> = {
      stepId: "complete",
      context: { name: "John" },
      history: ["welcome", "profile", "complete"],
      status: "complete",
    };

    const result = validatePersistedState(persisted, definition);

    expect(result.valid).toBe(true);
  });
});
