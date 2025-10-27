import { describe, expect, it } from "vitest";
import type { FlowDefinition } from "../types";
import {
  deserializeFlowState,
  extractPersistedState,
  type PersistedFlowState,
  restoreFlowState,
  serializeFlowState,
  validatePersistedState,
} from "./state";

describe("extractPersistedState", () => {
  it("should extract state without metadata", () => {
    const state = {
      stepId: "step1",
      context: { name: "John" },
      history: ["start", "step1"],
      status: "active" as const,
    };

    const persisted = extractPersistedState(state);

    expect(persisted).toEqual({
      stepId: "step1",
      context: { name: "John" },
      history: ["start", "step1"],
      status: "active",
      __meta: undefined,
    });
  });

  it("should extract state with metadata", () => {
    const state = {
      stepId: "step1",
      context: { name: "John" },
      history: ["start", "step1"],
      status: "active" as const,
    };

    const persisted = extractPersistedState(state, {
      version: "1.0",
      savedAt: 1234567890,
    });

    expect(persisted.__meta).toEqual({
      version: "1.0",
      savedAt: 1234567890,
    });
  });

  it("should clone history array", () => {
    const state = {
      stepId: "step1",
      context: { name: "John" },
      history: ["start", "step1"],
      status: "active" as const,
    };

    const persisted = extractPersistedState(state);

    expect(persisted.history).not.toBe(state.history);
    expect(persisted.history).toEqual(state.history);
  });
});

describe("restoreFlowState", () => {
  it("should restore state from persisted state", () => {
    const persisted: PersistedFlowState<{ name: string }> = {
      stepId: "step1",
      context: { name: "John" },
      history: ["start", "step1"],
      status: "active",
    };

    const state = restoreFlowState(persisted);

    expect(state).toEqual({
      stepId: "step1",
      context: { name: "John" },
      history: ["start", "step1"],
      status: "active",
    });
  });

  it("should clone history array", () => {
    const persisted: PersistedFlowState<{ name: string }> = {
      stepId: "step1",
      context: { name: "John" },
      history: ["start", "step1"],
      status: "active",
    };

    const state = restoreFlowState(persisted);

    expect(state.history).not.toBe(persisted.history);
    expect(state.history).toEqual(persisted.history);
  });

  it("should ignore metadata", () => {
    const persisted: PersistedFlowState<{ name: string }> = {
      stepId: "step1",
      context: { name: "John" },
      history: ["start", "step1"],
      status: "active",
      __meta: { version: "1.0", savedAt: 123456 },
    };

    const state = restoreFlowState(persisted);

    expect(state).not.toHaveProperty("__meta");
  });
});

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

describe("serializeFlowState", () => {
  it("should serialize state to JSON string", () => {
    const state: PersistedFlowState<{ name: string }> = {
      stepId: "profile",
      context: { name: "John" },
      history: ["welcome", "profile"],
      status: "active",
    };

    const json = serializeFlowState(state);

    expect(json).toBe(
      '{"stepId":"profile","context":{"name":"John"},"history":["welcome","profile"],"status":"active"}',
    );
  });

  it("should serialize state with metadata", () => {
    const state: PersistedFlowState<{ name: string }> = {
      stepId: "profile",
      context: { name: "John" },
      history: ["welcome", "profile"],
      status: "active",
      __meta: { version: "1.0" },
    };

    const json = serializeFlowState(state);
    const parsed = JSON.parse(json);

    expect(parsed.__meta).toEqual({ version: "1.0" });
  });
});

describe("deserializeFlowState", () => {
  it("should deserialize valid JSON string", () => {
    const json =
      '{"stepId":"profile","context":{"name":"John"},"history":["welcome","profile"],"status":"active"}';

    const state = deserializeFlowState<{ name: string }>(json);

    expect(state).toEqual({
      stepId: "profile",
      context: { name: "John" },
      history: ["welcome", "profile"],
      status: "active",
    });
  });

  it("should return null for invalid JSON", () => {
    const result = deserializeFlowState("invalid json");

    expect(result).toBeNull();
  });

  it("should return null for JSON with missing fields", () => {
    const json = '{"stepId":"profile","context":{"name":"John"}}';

    const result = deserializeFlowState(json);

    expect(result).toBeNull();
  });

  it("should return null for JSON with wrong types", () => {
    const json =
      '{"stepId":123,"context":{"name":"John"},"history":["welcome"],"status":"active"}';

    const result = deserializeFlowState(json);

    expect(result).toBeNull();
  });

  it("should return null for JSON with invalid status", () => {
    const json =
      '{"stepId":"profile","context":{"name":"John"},"history":["welcome"],"status":"invalid"}';

    const result = deserializeFlowState(json);

    expect(result).toBeNull();
  });

  it("should deserialize state with metadata", () => {
    const json =
      '{"stepId":"profile","context":{"name":"John"},"history":["welcome","profile"],"status":"active","__meta":{"version":"1.0"}}';

    const state = deserializeFlowState<{ name: string }>(json);

    expect(state?.__meta).toEqual({ version: "1.0" });
  });
});
