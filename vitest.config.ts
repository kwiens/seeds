import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    // Nested git worktrees under .claude/ carry their own test files, which
    // would otherwise run against this branch's source via the "@" alias.
    exclude: [...configDefaults.exclude, "**/.claude/**", "**/e2e/**"],
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "."),
    },
  },
});
