import { describe, expect, it } from "vitest";
import type { PersistedFlowState } from "../types";
import { JsonSerializer } from "./serializer";

describe("JsonSerializer", () => {
  describe("serialize", () => {
    it("should serialize a minimal flow state to JSON string", () => {
      const state: PersistedFlowState = {
        stepId: "step1",
        context: {},
        history: ["step1"],
        status: "active",
      };

      const result = JsonSerializer.serialize(state);

      expect(result).toBe(
        '{"stepId":"step1","context":{},"history":["step1"],"status":"active"}',
      );
    });

    it("should serialize flow state with context data", () => {
      const state: PersistedFlowState = {
        stepId: "profile",
        context: { name: "John", email: "john@example.com" },
        history: ["welcome", "profile"],
        status: "active",
      };

      const result = JsonSerializer.serialize(state);
      const parsed = JSON.parse(result);

      expect(parsed.stepId).toBe("profile");
      expect(parsed.context).toEqual({
        name: "John",
        email: "john@example.com",
      });
      expect(parsed.history).toEqual(["welcome", "profile"]);
      expect(parsed.status).toBe("active");
    });

    it("should serialize flow state with metadata", () => {
      const state: PersistedFlowState = {
        stepId: "step1",
        context: {},
        history: ["step1"],
        status: "active",
        __meta: {
          savedAt: 1234567890,
          version: "1.0.0",
          instanceId: "task-123",
        },
      };

      const result = JsonSerializer.serialize(state);
      const parsed = JSON.parse(result);

      expect(parsed.__meta).toEqual({
        savedAt: 1234567890,
        version: "1.0.0",
        instanceId: "task-123",
      });
    });

    it("should serialize flow state with complete status", () => {
      const state: PersistedFlowState = {
        stepId: "complete",
        context: { result: "success" },
        history: ["step1", "step2", "complete"],
        status: "complete",
      };

      const result = JsonSerializer.serialize(state);
      const parsed = JSON.parse(result);

      expect(parsed.status).toBe("complete");
    });

    it("should serialize flow state with nested context", () => {
      const state: PersistedFlowState = {
        stepId: "step1",
        context: {
          user: {
            name: "John",
            preferences: {
              theme: "dark",
              notifications: true,
            },
          },
        },
        history: ["step1"],
        status: "active",
      };

      const result = JsonSerializer.serialize(state);
      const parsed = JSON.parse(result);

      expect(parsed.context).toEqual({
        user: {
          name: "John",
          preferences: {
            theme: "dark",
            notifications: true,
          },
        },
      });
    });

    it("should serialize flow state with array in context", () => {
      const state: PersistedFlowState = {
        stepId: "step1",
        context: {
          items: ["item1", "item2", "item3"],
        },
        history: ["step1"],
        status: "active",
      };

      const result = JsonSerializer.serialize(state);
      const parsed = JSON.parse(result);

      expect(parsed.context.items).toEqual(["item1", "item2", "item3"]);
    });
  });

  describe("deserialize", () => {
    it("should deserialize a valid JSON string to flow state", () => {
      const json =
        '{"stepId":"step1","context":{},"history":["step1"],"status":"active"}';

      const result = JsonSerializer.deserialize(json);

      expect(result).toEqual({
        stepId: "step1",
        context: {},
        history: ["step1"],
        status: "active",
      });
    });

    it("should deserialize flow state with context data", () => {
      const json =
        '{"stepId":"profile","context":{"name":"John","email":"john@example.com"},"history":["welcome","profile"],"status":"active"}';

      const result = JsonSerializer.deserialize(json);

      expect(result).toEqual({
        stepId: "profile",
        context: { name: "John", email: "john@example.com" },
        history: ["welcome", "profile"],
        status: "active",
      });
    });

    it("should deserialize flow state with metadata", () => {
      const json =
        '{"stepId":"step1","context":{},"history":["step1"],"status":"active","__meta":{"savedAt":1234567890,"version":"1.0.0"}}';

      const result = JsonSerializer.deserialize(json);

      expect(result?.__meta).toEqual({
        savedAt: 1234567890,
        version: "1.0.0",
      });
    });

    it("should deserialize flow state with complete status", () => {
      const json =
        '{"stepId":"complete","context":{"result":"success"},"history":["step1","step2","complete"],"status":"complete"}';

      const result = JsonSerializer.deserialize(json);

      expect(result?.status).toBe("complete");
    });

    it("should return null for invalid JSON", () => {
      const result = JsonSerializer.deserialize("invalid json{");

      expect(result).toBeNull();
    });

    it("should return null for empty string", () => {
      const result = JsonSerializer.deserialize("");

      expect(result).toBeNull();
    });

    it("should return null for non-object JSON", () => {
      const result = JsonSerializer.deserialize('"just a string"');

      expect(result).toBeNull();
    });

    it("should return null for array JSON", () => {
      const result = JsonSerializer.deserialize('["array", "data"]');

      expect(result).toBeNull();
    });

    it("should return null for null JSON", () => {
      const result = JsonSerializer.deserialize("null");

      expect(result).toBeNull();
    });

    it("should return null when stepId is missing", () => {
      const json = '{"context":{},"history":["step1"],"status":"active"}';

      const result = JsonSerializer.deserialize(json);

      expect(result).toBeNull();
    });

    it("should return null when stepId is not a string", () => {
      const json =
        '{"stepId":123,"context":{},"history":["step1"],"status":"active"}';

      const result = JsonSerializer.deserialize(json);

      expect(result).toBeNull();
    });

    it("should return null when context is missing", () => {
      const json = '{"stepId":"step1","history":["step1"],"status":"active"}';

      const result = JsonSerializer.deserialize(json);

      expect(result).toBeNull();
    });

    it("should return null when context is not an object", () => {
      const json =
        '{"stepId":"step1","context":"not an object","history":["step1"],"status":"active"}';

      const result = JsonSerializer.deserialize(json);

      expect(result).toBeNull();
    });

    it("should return null when context is null", () => {
      const json =
        '{"stepId":"step1","context":null,"history":["step1"],"status":"active"}';

      const result = JsonSerializer.deserialize(json);

      expect(result).toBeNull();
    });

    it("should return null when history is missing", () => {
      const json = '{"stepId":"step1","context":{},"status":"active"}';

      const result = JsonSerializer.deserialize(json);

      expect(result).toBeNull();
    });

    it("should return null when history is not an array", () => {
      const json =
        '{"stepId":"step1","context":{},"history":"not an array","status":"active"}';

      const result = JsonSerializer.deserialize(json);

      expect(result).toBeNull();
    });

    it("should return null when status is missing", () => {
      const json = '{"stepId":"step1","context":{},"history":["step1"]}';

      const result = JsonSerializer.deserialize(json);

      expect(result).toBeNull();
    });

    it("should return null when status is invalid", () => {
      const json =
        '{"stepId":"step1","context":{},"history":["step1"],"status":"invalid"}';

      const result = JsonSerializer.deserialize(json);

      expect(result).toBeNull();
    });

    it("should return null when status is not a string", () => {
      const json =
        '{"stepId":"step1","context":{},"history":["step1"],"status":123}';

      const result = JsonSerializer.deserialize(json);

      expect(result).toBeNull();
    });

    it("should handle extra fields gracefully", () => {
      const json =
        '{"stepId":"step1","context":{},"history":["step1"],"status":"active","extraField":"ignored"}';

      const result = JsonSerializer.deserialize(json);

      expect(result).toEqual({
        stepId: "step1",
        context: {},
        history: ["step1"],
        status: "active",
        extraField: "ignored",
      });
    });
  });

  describe("round-trip", () => {
    it("should serialize and deserialize without data loss", () => {
      const original: PersistedFlowState = {
        stepId: "profile",
        context: {
          name: "John Doe",
          email: "john@example.com",
          preferences: { theme: "dark" },
        },
        history: ["welcome", "profile"],
        status: "active",
        __meta: {
          savedAt: Date.now(),
          version: "1.0.0",
          instanceId: "user-123",
        },
      };

      const serialized = JsonSerializer.serialize(original);
      const deserialized = JsonSerializer.deserialize(serialized);

      expect(deserialized).toEqual(original);
    });

    it("should handle minimal state round-trip", () => {
      const original: PersistedFlowState = {
        stepId: "step1",
        context: {},
        history: ["step1"],
        status: "active",
      };

      const serialized = JsonSerializer.serialize(original);
      const deserialized = JsonSerializer.deserialize(serialized);

      expect(deserialized).toEqual(original);
    });

    it("should handle complete status round-trip", () => {
      const original: PersistedFlowState = {
        stepId: "complete",
        context: { result: "success" },
        history: ["step1", "step2", "complete"],
        status: "complete",
      };

      const serialized = JsonSerializer.serialize(original);
      const deserialized = JsonSerializer.deserialize(serialized);

      expect(deserialized).toEqual(original);
    });
  });
});
