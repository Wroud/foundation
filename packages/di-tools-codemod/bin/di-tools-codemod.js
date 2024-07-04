#!/usr/bin/env node

import { run } from "jscodeshift/src/Runner";
import path from "node:path";
import { existsSync, readFileSync } from "node:fs";

const transformPath = path.resolve("../dist/index.js");
const paths = process.argv.slice(2);
let migrationOptions = {};

const migrationOptionsPath = path.resolve(
  process.cwd(),
  "di-tools-codemod.json",
);

if (existsSync(migrationOptionsPath)) {
  migrationOptions = JSON.parse(readFileSync(migrationOptionsPath, "utf8"));
}

const res = await run(transformPath, paths, {
  ...migrationOptions,
  cpus: 1,
});
console.log(res);
