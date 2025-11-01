import { describe, expect, it } from "vitest";
import type { PersistedFlowInstance, PersistedFlowState } from "../types";
import { JsonSerializer } from "./serializer";

describe("JsonSerializer", () => {
  describe("serialize", () => {
    it("should serialize a flow instance to JSON string", () => {
      const state: PersistedFlowState = {
        stepId: "step1",
        startedAt: 1234567890,
        context: {},
        path: [{ stepId: "step1", startedAt: 1234567890 }],
        history: [{ stepId: "step1", startedAt: 1234567890 }],
        status: "active",
      };

      const instance: PersistedFlowInstance = {
        flowId: "test-flow",
        instanceId: "default",
        variantId: "default",
        state,
      };

      const result = JsonSerializer.serialize(
        instance as unknown as PersistedFlowState,
      );

      expect(result).toBe(
        '{"flowId":"test-flow","instanceId":"default","variantId":"default","state":{"stepId":"step1","startedAt":1234567890,"context":{},"path":[{"stepId":"step1","startedAt":1234567890}],"history":[{"stepId":"step1","startedAt":1234567890}],"status":"active"}}',
      );
    });

    it("should serialize flow instance with context data", () => {
      const state: PersistedFlowState = {
        stepId: "profile",
        startedAt: 1234567890,
        context: { name: "John", email: "john@example.com" },
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

      const instance: PersistedFlowInstance = {
        flowId: "onboarding",
        instanceId: "user-123",
        variantId: "default",
        state,
      };

      const result = JsonSerializer.serialize(
        instance as unknown as PersistedFlowState,
      );
      const parsed = JSON.parse(result);

      expect(parsed.flowId).toBe("onboarding");
      expect(parsed.instanceId).toBe("user-123");
      expect(parsed.variantId).toBe("default");
      expect(parsed.state.stepId).toBe("profile");
      expect(parsed.state.context).toEqual({
        name: "John",
        email: "john@example.com",
      });
      expect(parsed.state.path).toEqual([
        { stepId: "welcome", startedAt: 1234567890 },
        { stepId: "profile", startedAt: 1234567891 },
      ]);
      expect(parsed.state.history).toEqual([
        { stepId: "welcome", startedAt: 1234567890 },
        { stepId: "profile", startedAt: 1234567891 },
      ]);
      expect(parsed.state.status).toBe("active");
    });

    it("should serialize flow instance with metadata", () => {
      const state: PersistedFlowState = {
        stepId: "step1",
        startedAt: 1234567890,
        context: {},
        path: [{ stepId: "step1", startedAt: 1234567890 }],
        history: [{ stepId: "step1", startedAt: 1234567890 }],
        status: "active",
        __meta: {
          savedAt: 1234567890,
          version: "1.0.0",
        },
      };

      const instance: PersistedFlowInstance = {
        flowId: "test-flow",
        instanceId: "default",
        variantId: "default",
        state,
      };

      const result = JsonSerializer.serialize(
        instance as unknown as PersistedFlowState,
      );
      const parsed = JSON.parse(result);

      expect(parsed.state.__meta).toEqual({
        savedAt: 1234567890,
        version: "1.0.0",
      });
    });

    it("should serialize flow instance with complete status", () => {
      const state: PersistedFlowState = {
        stepId: "complete",
        startedAt: 1234567890,
        context: { result: "success" },
        path: [
          { stepId: "step1", startedAt: 1234567890 },
          { stepId: "step2", startedAt: 1234567891 },
          { stepId: "complete", startedAt: 1234567892 },
        ],
        history: [
          { stepId: "step1", startedAt: 1234567890 },
          { stepId: "step2", startedAt: 1234567891 },
          { stepId: "complete", startedAt: 1234567892 },
        ],
        status: "complete",
      };

      const instance: PersistedFlowInstance = {
        flowId: "survey",
        instanceId: "default",
        variantId: "default",
        state,
      };

      const result = JsonSerializer.serialize(
        instance as unknown as PersistedFlowState,
      );
      const parsed = JSON.parse(result);

      expect(parsed.state.status).toBe("complete");
    });

    it("should serialize flow instance with nested context", () => {
      const state: PersistedFlowState = {
        stepId: "step1",
        startedAt: 1234567890,
        context: {
          user: {
            name: "John",
            preferences: {
              theme: "dark",
              notifications: true,
            },
          },
        },
        path: [{ stepId: "step1", startedAt: 1234567890 }],
        history: [{ stepId: "step1", startedAt: 1234567890 }],
        status: "active",
      };

      const instance: PersistedFlowInstance = {
        flowId: "test-flow",
        instanceId: "default",
        variantId: "default",
        state,
      };

      const result = JsonSerializer.serialize(
        instance as unknown as PersistedFlowState,
      );
      const parsed = JSON.parse(result);

      expect(parsed.state.context).toEqual({
        user: {
          name: "John",
          preferences: {
            theme: "dark",
            notifications: true,
          },
        },
      });
    });

    it("should serialize flow instance with array in context", () => {
      const state: PersistedFlowState = {
        stepId: "step1",
        startedAt: 1234567890,
        context: {
          items: ["item1", "item2", "item3"],
        },
        path: [{ stepId: "step1", startedAt: 1234567890 }],
        history: [{ stepId: "step1", startedAt: 1234567890 }],
        status: "active",
      };

      const instance: PersistedFlowInstance = {
        flowId: "test-flow",
        instanceId: "default",
        variantId: "default",
        state,
      };

      const result = JsonSerializer.serialize(
        instance as unknown as PersistedFlowState,
      );
      const parsed = JSON.parse(result);

      expect(parsed.state.context.items).toEqual(["item1", "item2", "item3"]);
    });
  });

  describe("deserialize", () => {
    it("should deserialize a valid flow instance", () => {
      const json =
        '{"flowId":"test-flow","instanceId":"default","variantId":"default","state":{"stepId":"step1","context":{},"path":[{"stepId":"step1","startedAt":1234567890}],"history":[{"stepId":"step1","startedAt":1234567890}],"status":"active"}}';

      const result = JsonSerializer.deserialize(json);

      // Cast back to instance to verify structure
      const instance = result as unknown as PersistedFlowInstance;
      expect(instance.flowId).toBe("test-flow");
      expect(instance.instanceId).toBe("default");
      expect(instance.variantId).toBe("default");
      expect(instance.state).toEqual({
        stepId: "step1",
        context: {},
        path: [{ stepId: "step1", startedAt: 1234567890 }],
        history: [{ stepId: "step1", startedAt: 1234567890 }],
        status: "active",
      });
    });

    it("should deserialize flow instance with context data", () => {
      const json =
        '{"flowId":"onboarding","instanceId":"user-123","variantId":"premium","state":{"stepId":"profile","context":{"name":"John","email":"john@example.com"},"path":[{"stepId":"welcome","startedAt":1234567890},{"stepId":"profile","startedAt":1234567891}],"history":[{"stepId":"welcome","startedAt":1234567890},{"stepId":"profile","startedAt":1234567891}],"status":"active"}}';

      const result = JsonSerializer.deserialize(json);

      const instance = result as unknown as PersistedFlowInstance;
      expect(instance.flowId).toBe("onboarding");
      expect(instance.instanceId).toBe("user-123");
      expect(instance.variantId).toBe("premium");
      expect(instance.state.context).toEqual({
        name: "John",
        email: "john@example.com",
      });
    });

    it("should deserialize flow instance with metadata", () => {
      const json =
        '{"flowId":"test-flow","instanceId":"default","variantId":"default","state":{"stepId":"step1","context":{},"path":[{"stepId":"step1","startedAt":1234567890}],"history":[{"stepId":"step1","startedAt":1234567890}],"status":"active","__meta":{"savedAt":1234567890,"version":"1.0.0"}}}';

      const result = JsonSerializer.deserialize(json);

      const instance = result as unknown as PersistedFlowInstance;
      expect(instance.state.__meta).toEqual({
        savedAt: 1234567890,
        version: "1.0.0",
      });
    });

    it("should deserialize flow instance with complete status", () => {
      const json =
        '{"flowId":"survey","instanceId":"default","variantId":"default","state":{"stepId":"complete","context":{"result":"success"},"path":[{"stepId":"step1","startedAt":1234567890},{"stepId":"step2","startedAt":1234567891},{"stepId":"complete","startedAt":1234567892}],"history":[{"stepId":"step1","startedAt":1234567890},{"stepId":"step2","startedAt":1234567891},{"stepId":"complete","startedAt":1234567892}],"status":"complete"}}';

      const result = JsonSerializer.deserialize(json);

      const instance = result as unknown as PersistedFlowInstance;
      expect(instance.state.status).toBe("complete");
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

    it("should return null when flowId is missing", () => {
      const json =
        '{"instanceId":"default","variantId":"default","state":{"stepId":"step1","context":{},"path":[{"stepId":"step1","startedAt":1234567890}],"history":[{"stepId":"step1","startedAt":1234567890}],"status":"active"}}';

      const result = JsonSerializer.deserialize(json);

      expect(result).toBeNull();
    });

    it("should return null when flowId is not a string", () => {
      const json =
        '{"flowId":123,"instanceId":"default","variantId":"default","state":{"stepId":"step1","context":{},"path":[{"stepId":"step1","startedAt":1234567890}],"history":[{"stepId":"step1","startedAt":1234567890}],"status":"active"}}';

      const result = JsonSerializer.deserialize(json);

      expect(result).toBeNull();
    });

    it("should return null when instanceId is missing", () => {
      const json =
        '{"flowId":"test-flow","variantId":"default","state":{"stepId":"step1","context":{},"path":[{"stepId":"step1","startedAt":1234567890}],"history":[{"stepId":"step1","startedAt":1234567890}],"status":"active"}}';

      const result = JsonSerializer.deserialize(json);

      expect(result).toBeNull();
    });

    it("should return null when instanceId is not a string", () => {
      const json =
        '{"flowId":"test-flow","instanceId":123,"variantId":"default","state":{"stepId":"step1","context":{},"path":[{"stepId":"step1","startedAt":1234567890}],"history":[{"stepId":"step1","startedAt":1234567890}],"status":"active"}}';

      const result = JsonSerializer.deserialize(json);

      expect(result).toBeNull();
    });

    it("should return null when variantId is missing", () => {
      const json =
        '{"flowId":"test-flow","instanceId":"default","state":{"stepId":"step1","context":{},"path":[{"stepId":"step1","startedAt":1234567890}],"history":[{"stepId":"step1","startedAt":1234567890}],"status":"active"}}';

      const result = JsonSerializer.deserialize(json);

      expect(result).toBeNull();
    });

    it("should return null when variantId is not a string", () => {
      const json =
        '{"flowId":"test-flow","instanceId":"default","variantId":123,"state":{"stepId":"step1","context":{},"path":[{"stepId":"step1","startedAt":1234567890}],"history":[{"stepId":"step1","startedAt":1234567890}],"status":"active"}}';

      const result = JsonSerializer.deserialize(json);

      expect(result).toBeNull();
    });

    it("should return null when state is missing", () => {
      const json =
        '{"flowId":"test-flow","instanceId":"default","variantId":"default"}';

      const result = JsonSerializer.deserialize(json);

      expect(result).toBeNull();
    });

    it("should return null when state is not an object", () => {
      const json =
        '{"flowId":"test-flow","instanceId":"default","variantId":"default","state":"not an object"}';

      const result = JsonSerializer.deserialize(json);

      expect(result).toBeNull();
    });

    it("should return null when state is null", () => {
      const json =
        '{"flowId":"test-flow","instanceId":"default","variantId":"default","state":null}';

      const result = JsonSerializer.deserialize(json);

      expect(result).toBeNull();
    });

    it("should handle extra fields gracefully", () => {
      const json =
        '{"flowId":"test-flow","instanceId":"default","variantId":"default","state":{"stepId":"step1","context":{},"path":[{"stepId":"step1","startedAt":1234567890}],"history":[{"stepId":"step1","startedAt":1234567890}],"status":"active"},"extraField":"ignored"}';

      const result = JsonSerializer.deserialize(json);

      expect(result).not.toBeNull();
      const instance = result as unknown as PersistedFlowInstance;
      expect(instance.flowId).toBe("test-flow");
    });
  });

  describe("round-trip", () => {
    it("should serialize and deserialize without data loss", () => {
      const state: PersistedFlowState = {
        stepId: "profile",
        startedAt: 1234567890,
        context: {
          name: "John Doe",
          email: "john@example.com",
          preferences: { theme: "dark" },
        },
        path: [
          { stepId: "welcome", startedAt: 1234567890 },
          { stepId: "profile", startedAt: 1234567891 },
        ],
        history: [
          { stepId: "welcome", startedAt: 1234567890 },
          { stepId: "profile", startedAt: 1234567891 },
        ],
        status: "active",
        __meta: {
          savedAt: Date.now(),
          version: "1.0.0",
        },
      };

      const original: PersistedFlowInstance = {
        flowId: "onboarding",
        instanceId: "user-123",
        variantId: "premium",
        state,
      };

      const serialized = JsonSerializer.serialize(
        original as unknown as PersistedFlowState,
      );
      const deserialized = JsonSerializer.deserialize(serialized);

      expect(deserialized).toEqual(original);
    });

    it("should handle minimal instance round-trip", () => {
      const state: PersistedFlowState = {
        stepId: "step1",
        startedAt: 1234567890,
        context: {},
        path: [{ stepId: "step1", startedAt: 1234567890 }],
        history: [{ stepId: "step1", startedAt: 1234567890 }],
        status: "active",
      };

      const original: PersistedFlowInstance = {
        flowId: "test-flow",
        instanceId: "default",
        variantId: "default",
        state,
      };

      const serialized = JsonSerializer.serialize(
        original as unknown as PersistedFlowState,
      );
      const deserialized = JsonSerializer.deserialize(serialized);

      expect(deserialized).toEqual(original);
    });

    it("should handle complete status round-trip", () => {
      const state: PersistedFlowState = {
        stepId: "complete",
        startedAt: 1234567890,
        context: { result: "success" },
        path: [
          { stepId: "step1", startedAt: 1234567890 },
          { stepId: "step2", startedAt: 1234567891 },
          { stepId: "complete", startedAt: 1234567892 },
        ],
        history: [
          { stepId: "step1", startedAt: 1234567890 },
          { stepId: "step2", startedAt: 1234567891 },
          { stepId: "complete", startedAt: 1234567892 },
        ],
        status: "complete",
      };

      const original: PersistedFlowInstance = {
        flowId: "survey",
        instanceId: "default",
        variantId: "default",
        state,
      };

      const serialized = JsonSerializer.serialize(
        original as unknown as PersistedFlowState,
      );
      const deserialized = JsonSerializer.deserialize(serialized);

      expect(deserialized).toEqual(original);
    });
  });
});
