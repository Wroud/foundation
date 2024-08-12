import { defineConfig, coverageConfigDefaults } from "vitest/config";

export default defineConfig({
  build: {
    target: "esnext",
  },
  esbuild: false,
  test: {
    isolate: false,

    setupFiles: [import.meta.resolve("./vitest.setup.ts")],

    include: ["**/lib/**/*.test.js"],
    coverage: {
      enabled: true,
      all: false,
      skipFull: true,
      reportOnFailure: true,
      exclude: [
        ...coverageConfigDefaults.exclude,
        "**/lib/tests/**",
        "**/src/tests/**",
      ],
      reporter: ["json", "json-summary", "text", "text-summary"],
    },
  },
});
