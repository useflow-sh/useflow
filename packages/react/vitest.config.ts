import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    silent: true,
    coverage: {
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "**/*.config.{ts,js}",
        "**/tsconfig.json",
        "**/dist/**",
        "**/node_modules/**",
        "**/*.test.{ts,tsx}",
        "**/*.setup.{ts,tsx}",
      ],
    },
  },
});
