import { describe, expect, it } from "vitest";
import { defineFlow, RuntimeFlowDefinition } from "./define-flow";

describe("defineFlow", () => {
  it("should create a RuntimeFlowDefinition instance", () => {
    const flow = defineFlow({
      id: "test",
      start: "first",
      steps: {
        first: { next: "second" },
        second: {},
      },
    });

    expect(flow).toBeInstanceOf(RuntimeFlowDefinition);
    expect(flow.id).toBe("test");
    expect(flow.config.id).toBe("test");
  });

  it("should validate flow definition on creation", () => {
    expect(() =>
      defineFlow({
        id: "test",
        start: "missing",
        steps: {
          first: {},
        },
      }),
    ).toThrow('Start step "missing" does not exist');
  });

  it("should create flow without runtime config", () => {
    const flow = defineFlow({
      id: "test",
      start: "first",
      steps: {
        first: {},
      },
    });

    expect(flow.runtimeConfig).toBeUndefined();
  });
});

describe("RuntimeFlowDefinition", () => {
  describe("constructor", () => {
    it("should set id, config, and runtimeConfig properties", () => {
      const config = {
        id: "test",
        start: "first",
        steps: {
          first: {},
        },
      };

      const runtimeConfig = {
        resolvers: {},
      };

      const flow = new RuntimeFlowDefinition(config, runtimeConfig);

      expect(flow.id).toBe("test");
      expect(flow.config).toBe(config);
      expect(flow.runtimeConfig).toBe(runtimeConfig);
    });

    it("should validate flow definition in constructor", () => {
      expect(
        () =>
          new RuntimeFlowDefinition({
            id: "test",
            start: "missing",
            steps: {
              first: {},
            },
          }),
      ).toThrow('Start step "missing" does not exist');
    });

    it("should allow undefined runtimeConfig", () => {
      const flow = new RuntimeFlowDefinition({
        id: "test",
        start: "first",
        steps: {
          first: {},
        },
      });

      expect(flow.runtimeConfig).toBeUndefined();
    });
  });

  describe("with()", () => {
    it("should create new instance with runtime config", () => {
      const originalFlow = defineFlow({
        id: "test",
        start: "first",
        steps: {
          first: { next: ["second", "third"] },
          second: {},
          third: {},
        },
      });

      type MyContext = { choice: "second" | "third" };

      const flowWithConfig = originalFlow.with<MyContext>((steps) => ({
        resolvers: {
          first: (ctx) =>
            ctx.choice === "second" ? steps.second : steps.third,
        },
      }));

      expect(flowWithConfig).toBeInstanceOf(RuntimeFlowDefinition);
      expect(flowWithConfig).not.toBe(originalFlow);
      expect(flowWithConfig.id).toBe("test");
      expect(flowWithConfig.config).toBe(originalFlow.config);
      expect(flowWithConfig.runtimeConfig).toBeDefined();
      expect(flowWithConfig.runtimeConfig?.resolvers).toBeDefined();
    });

    it("should provide type-safe step references", () => {
      const flow = defineFlow({
        id: "test",
        start: "first",
        steps: {
          first: { next: ["second", "third"] },
          second: {},
          third: {},
        },
      });

      type MyContext = { value: string };

      const flowWithConfig = flow.with<MyContext>((steps) => {
        // Verify step refs are provided
        expect(steps.first).toBe("first");
        expect(steps.second).toBe("second");
        expect(steps.third).toBe("third");

        return {
          resolvers: {
            first: () => steps.second,
          },
        };
      });

      expect(flowWithConfig.runtimeConfig?.resolvers?.first).toBeDefined();
    });

    it("should support migration in runtime config", () => {
      const flow = defineFlow({
        id: "test",
        version: "v2",
        start: "first",
        steps: {
          first: { next: "second" },
          second: {},
        },
      });

      type MyContext = { value: string };

      const flowWithMigration = flow.with<MyContext>((steps) => ({
        migration: (state, fromVersion) => {
          if (fromVersion === "v1") {
            return {
              ...state,
              stepId: steps.second,
            };
          }
          return null;
        },
      }));

      expect(flowWithMigration.runtimeConfig?.migration).toBeDefined();
    });

    it("should support both resolvers and migration", () => {
      const flow = defineFlow({
        id: "test",
        version: "v2",
        start: "first",
        steps: {
          first: { next: ["second", "third"] },
          second: {},
          third: {},
        },
      });

      type MyContext = { choice: "second" | "third" };

      const flowWithBoth = flow.with<MyContext>((steps) => ({
        resolvers: {
          first: (ctx) =>
            ctx.choice === "second" ? steps.second : steps.third,
        },
        migration: (state) => state,
      }));

      expect(flowWithBoth.runtimeConfig?.resolvers).toBeDefined();
      expect(flowWithBoth.runtimeConfig?.migration).toBeDefined();
    });

    it("should allow calling with() without config function", () => {
      const flow = defineFlow({
        id: "test",
        start: "first",
        steps: {
          first: {},
        },
      });

      type MyContext = { value: string };

      const flowWithType = flow.with<MyContext>();

      expect(flowWithType).toBeInstanceOf(RuntimeFlowDefinition);
      expect(flowWithType.runtimeConfig).toBeUndefined();
    });

    it("should allow calling with() with undefined config", () => {
      const flow = defineFlow({
        id: "test",
        start: "first",
        steps: {
          first: {},
        },
      });

      type MyContext = { value: string };

      const flowWithType = flow.with<MyContext>(undefined);

      expect(flowWithType).toBeInstanceOf(RuntimeFlowDefinition);
      expect(flowWithType.runtimeConfig).toBeUndefined();
    });

    it("should be immutable - original flow unchanged", () => {
      const originalFlow = defineFlow({
        id: "test",
        start: "first",
        steps: {
          first: { next: ["second", "third"] },
          second: {},
          third: {},
        },
      });

      type MyContext = { choice: "second" | "third" };

      const flowWithConfig = originalFlow.with<MyContext>((steps) => ({
        resolvers: {
          first: (ctx) =>
            ctx.choice === "second" ? steps.second : steps.third,
        },
      }));

      expect(originalFlow.runtimeConfig).toBeUndefined();
      expect(flowWithConfig.runtimeConfig).toBeDefined();
    });

    it("should allow chaining multiple with() calls", () => {
      const flow = defineFlow({
        id: "test",
        start: "first",
        steps: {
          first: { next: ["second", "third"] },
          second: {},
          third: {},
        },
      });

      type Context1 = { value: string };
      type Context2 = { value: string; extra: number };

      const flow1 = flow.with<Context1>();
      const flow2 = flow1.with<Context2>((steps) => ({
        resolvers: {
          first: (ctx) => (ctx.extra > 0 ? steps.second : steps.third),
        },
      }));

      expect(flow2).toBeInstanceOf(RuntimeFlowDefinition);
      expect(flow2.runtimeConfig?.resolvers).toBeDefined();
    });

    it("should create step refs for all steps in definition", () => {
      const flow = defineFlow({
        id: "test",
        start: "first",
        steps: {
          first: { next: "second" },
          second: { next: "third" },
          third: { next: "fourth" },
          fourth: {},
        },
      });

      flow.with((steps) => {
        expect(Object.keys(steps)).toEqual([
          "first",
          "second",
          "third",
          "fourth",
        ]);
        expect(steps.first).toBe("first");
        expect(steps.second).toBe("second");
        expect(steps.third).toBe("third");
        expect(steps.fourth).toBe("fourth");
        return {};
      });
    });
  });
});
