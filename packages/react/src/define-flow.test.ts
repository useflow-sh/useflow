import { describe, expect, it } from "vitest";
import { defineFlow } from "./define-flow";

describe("defineFlow validation", () => {
  it("should throw error when defining flow with missing next step", () => {
    expect(() =>
      defineFlow({
        id: "test",
        start: "first",
        steps: {
          first: { next: "missing" }, // "missing" doesn't exist!
          second: {},
        },
      }),
    ).toThrow('Step "first" references non-existent step "missing"');
  });

  it("should throw error when start step doesn't exist", () => {
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

  it("should throw error for invalid array references", () => {
    expect(() =>
      defineFlow({
        id: "test",
        start: "first",
        steps: {
          first: { next: ["second", "missing"] },
          second: {},
        },
      }),
    ).toThrow('Step "first" references non-existent step "missing"');
  });

  it("should not throw for valid flow definition", () => {
    expect(() =>
      defineFlow({
        id: "test",
        start: "first",
        steps: {
          first: { next: "second" },
          second: { next: ["third", "fourth"] },
          third: {},
          fourth: {},
        },
      }),
    ).not.toThrow();
  });

  it("should not validate resolve returns at definition time", () => {
    // resolve functions can't be validated statically, only at runtime
    expect(() =>
      defineFlow({
        id: "test",
        start: "first",
        steps: {
          first: {
            next: ["second"],
            resolve: () => "missing", // Can't validate this at definition time
          },
          second: {},
        },
      }),
    ).not.toThrow();
  });
});
