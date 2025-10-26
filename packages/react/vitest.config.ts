import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
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
