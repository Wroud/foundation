import { existsSync } from "fs";
import path from "path";
import { defineConfig, coverageConfigDefaults } from "vitest/config";

export default defineConfig({
  build: {
    target: "esnext",
  },
  esbuild: false,
  test: {
    // isolate: false,

    setupFiles: [import.meta.resolve("./vitest.setup.ts")],

    include: ["**/lib/**/*.test.js"],
    poolOptions: {
      forks: {
        execArgv: ["--expose-gc"],
      },
    },
    resolveSnapshotPath: (testPath, snapExtension) => {
      let dir = path.dirname(testPath);
      let snapshotName = path.basename(testPath) + snapExtension;

      while (true) {
        let packageJson = path.join(dir, "package.json");
        if (existsSync(packageJson)) {
          return path.join(dir, "__snapshots__", snapshotName);
        }
        dir = path.dirname(dir);

        if (dir === import.meta.dirname) {
          break;
        }
      }

      throw new Error("Could not find package.json for snapshot resolution");
    },
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
