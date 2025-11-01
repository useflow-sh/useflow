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
      path: [
        { stepId: "welcome", startedAt: 1234567890 },
        { stepId: "profile", startedAt: 1234567891 },
      ],
      history: [
        { stepId: "welcome", startedAt: 1234567890 },
        { stepId: "profile", startedAt: 1234567891 },
      ],
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
      path: [
        { stepId: "welcome", startedAt: 1234567890 },
        { stepId: "invalid", startedAt: 1234567891 },
      ],
      history: [
        { stepId: "welcome", startedAt: 1234567890 },
        { stepId: "invalid", startedAt: 1234567891 },
      ],
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
      path: [],
      history: [],
      status: "active",
    };

    const result = validatePersistedState(persisted, definition);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Path cannot be empty");
  });

  it("should reject state with wrong start step in history", () => {
    const persisted: PersistedFlowState<{ name: string }> = {
      stepId: "profile",
      context: { name: "John" },
      path: [{ stepId: "profile", startedAt: 1234567890 }],
      history: [{ stepId: "profile", startedAt: 1234567890 }],
      status: "active",
    };

    const result = validatePersistedState(persisted, definition);

    expect(result.valid).toBe(false);
    expect(
      result.errors?.some((e) => e.includes('Path must start with "welcome"')),
    ).toBe(true);
  });

  it("should reject state with invalid step in history", () => {
    const persisted: PersistedFlowState<{ name: string }> = {
      stepId: "profile",
      context: { name: "John" },
      path: [
        { stepId: "welcome", startedAt: 1234567890 },
        { stepId: "invalid", startedAt: 1234567891 },
        { stepId: "profile", startedAt: 1234567892 },
      ],
      history: [
        { stepId: "welcome", startedAt: 1234567890 },
        { stepId: "invalid", startedAt: 1234567891 },
        { stepId: "profile", startedAt: 1234567892 },
      ],
      status: "active",
    };

    const result = validatePersistedState(persisted, definition);

    expect(result.valid).toBe(false);
    expect(
      result.errors?.some((e) =>
        e.includes('Path contains non-existent step "invalid"'),
      ),
    ).toBe(true);
  });

  it("should reject state where stepId doesn't match last history item", () => {
    const persisted: PersistedFlowState<{ name: string }> = {
      stepId: "complete",
      context: { name: "John" },
      path: [
        { stepId: "welcome", startedAt: 1234567890 },
        { stepId: "profile", startedAt: 1234567891 },
      ],
      history: [
        { stepId: "welcome", startedAt: 1234567890 },
        { stepId: "profile", startedAt: 1234567891 },
      ],
      status: "active",
    };

    const result = validatePersistedState(persisted, definition);

    expect(result.valid).toBe(false);
    expect(
      result.errors?.some((e) =>
        e.includes(
          'Current stepId "complete" must match last item in path "profile"',
        ),
      ),
    ).toBe(true);
  });

  it("should reject state with incorrect status", () => {
    const persisted: PersistedFlowState<{ name: string }> = {
      stepId: "complete",
      context: { name: "John" },
      path: [
        { stepId: "welcome", startedAt: 1234567890 },
        { stepId: "profile", startedAt: 1234567891 },
        { stepId: "complete", startedAt: 1234567892 },
      ],
      history: [
        { stepId: "welcome", startedAt: 1234567890 },
        { stepId: "profile", startedAt: 1234567891 },
        { stepId: "complete", startedAt: 1234567892 },
      ],
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
      path: [
        { stepId: "welcome", startedAt: 1234567890 },
        { stepId: "profile", startedAt: 1234567891 },
        { stepId: "complete", startedAt: 1234567892 },
      ],
      history: [
        { stepId: "welcome", startedAt: 1234567890 },
        { stepId: "profile", startedAt: 1234567891 },
        { stepId: "complete", startedAt: 1234567892 },
      ],
      status: "complete",
    };

    const result = validatePersistedState(persisted, definition);

    expect(result.valid).toBe(true);
  });
});
