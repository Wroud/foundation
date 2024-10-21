#!/usr/bin/env node

import v8 from "node:v8";
import path from "node:path";
import { startVitest, parseCLI } from "vitest/node";

v8.setFlagsFromString("--expose-gc");
const { filter, options } = parseCLI(["vitest", ...process.argv.slice(2)]);
const vitest = await startVitest("test", filter, {
  config: path.resolve(import.meta.dirname, "../vitest.config.ts"),
  ...options,
});

await vitest?.close();
