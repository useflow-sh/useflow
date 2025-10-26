import { describe, expect, it } from "vitest";
import * as api from "./index";

describe("Public API", () => {
  it("should export flowReducer function", () => {
    expect(api.flowReducer).toBeDefined();
    expect(typeof api.flowReducer).toBe("function");
  });

  it("should export createInitialState function", () => {
    expect(api.createInitialState).toBeDefined();
    expect(typeof api.createInitialState).toBe("function");
  });
});
