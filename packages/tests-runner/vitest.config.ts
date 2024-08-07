import { defineConfig } from "vitest/config";

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
      reporter: ["json", "json-summary", "text", "text-summary"],
    },
  },
});
