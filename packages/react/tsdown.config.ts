import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts", "!src/**/*.test.*"],
  format: ["esm"],
  clean: true,
  dts: true,
  external: ["react"],
});
