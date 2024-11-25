#!/usr/bin/env node

import v8 from "node:v8";
import path from "node:path";
import { startVitest, parseCLI } from "vitest/node";

v8.setFlagsFromString("--expose-gc");
process.env["NODE_ENV"] = "production";
const { filter, options } = parseCLI(["vitest", ...process.argv.slice(2)]);
const vitest = await startVitest("benchmark", filter, {
  config: path.resolve(import.meta.dirname, "../vitest.config.ts"),
  ...options,
  mode: "production",
});

await vitest?.close();
