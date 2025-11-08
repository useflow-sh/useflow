import { describe, expect, it } from "vitest";
import * as api from "./index";

describe("Public API", () => {
  it("should export defineFlow function", () => {
    expect(api.defineFlow).toBeDefined();
    expect(typeof api.defineFlow).toBe("function");
  });

  it("should export Flow component", () => {
    expect(api.Flow).toBeDefined();
    expect(typeof api.Flow).toBe("function");
  });

  it("should export useFlowState hook", () => {
    expect(api.useFlowState).toBeDefined();
    expect(typeof api.useFlowState).toBe("function");
  });
});
