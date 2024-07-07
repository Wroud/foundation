#!/usr/bin/env node

import v8 from "v8";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { startVitest, parseCLI } from "vitest/node";

v8.setFlagsFromString("--expose-gc");
const { filters, options } = parseCLI(["vitest", ...process.argv.slice(2)]);
const vitest = await startVitest(
  "test",
  { ...filters },
  {
    config: path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      "../vitest.config.ts",
    ),
    ...options,
  },
);

await vitest?.close();
