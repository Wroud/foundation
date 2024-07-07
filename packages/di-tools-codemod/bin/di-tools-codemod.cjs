#!/usr/bin/env node

const { run } = require("jscodeshift/src/Runner.js");
const path = require("node:path");
const { existsSync, readFileSync } = require("node:fs");

const transformPath = require.resolve("../commonjs/index.js");
const paths = process.argv.slice(2);
let migrationOptions = {};

const migrationOptionsPath = path.resolve(
  process.cwd(),
  "di-tools-codemod.json",
);

if (existsSync(migrationOptionsPath)) {
  migrationOptions = JSON.parse(readFileSync(migrationOptionsPath, "utf8"));
}

run(transformPath, paths, {
  ...migrationOptions,
  cpus: 1,
});
