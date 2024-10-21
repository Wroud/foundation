import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { initTsProject } from "./templates/project/initTsProject.js";
import { initTsConfig } from "./templates/tsconfig/initTsConfig.js";
import { ES_TARGETS } from "./ES_TARGETS.js";
import { parsePackageName } from "./pasrsePackageName.js";
import { getDefaultProjectName } from "./getDefaultProjectName.js";

export function configureYargs(args: string[], cwd?: string) {
  return yargs(hideBin(args), cwd)
    .scriptName("ts-template")
    .command(
      "tsconfig [name]",
      "Create a new project with base tsconfig",
      (yargs) => {
        return yargs
          .positional("name", {
            describe: "Name of the project (npm package name)",
            type: "string",
            default: getDefaultProjectName(),
          })
          .options({
            immutable: {
              alias: "i",
              type: "boolean",
              description: "Do not modify files, just print what would be done",
              default: false,
            },
            verbose: {
              alias: "v",
              type: "boolean",
              description: "Print verbose output",
              default: false,
            },
            target: {
              alias: "t",
              describe: "Specify the ECMAScript target (e.g., esnext, es2022)",
              type: "string",
              choices: ES_TARGETS,
              default: "esnext",
            },
          });
      },
      async ({ name, target, immutable, verbose }) => {
        await initTsConfig({
          path: process.cwd(),
          packageName: parsePackageName(name),
          target,
          immutable,
          verbose,
        });
      },
    )
    .command(
      "project [name]",
      "Create a new project that will reference a base tsconfig project",
      (yargs) => {
        return yargs
          .positional("name", {
            describe: "Name of the project (npm package name)",
            type: "string",
            default: getDefaultProjectName(),
          })
          .options({
            tsconfig: {
              alias: "ts",
              type: "string",
              description:
                "Name of tsconfig package to link to from same scope or full package name",
              default: "tsconfig",
            },
            immutable: {
              alias: "i",
              type: "boolean",
              description: "Do not modify files, just print what would be done",
              default: false,
            },
            verbose: {
              alias: "v",
              type: "boolean",
              description: "Print verbose output",
              default: false,
            },
            target: {
              alias: "t",
              describe: "Specify the ECMAScript target (e.g., esnext, es2022)",
              type: "string",
              choices: ES_TARGETS,
            },
          });
      },
      async ({ name, tsconfig, target, immutable, verbose }) => {
        const packageName = parsePackageName(name);
        const tsConfigName = parsePackageName(tsconfig, packageName.scope);

        await initTsProject({
          path: process.cwd(),
          packageName: parsePackageName(name),
          tsconfig: tsConfigName,
          target,
          immutable,
          verbose,
        });
      },
    )
    .strict()
    .demandCommand(1, "You need to provide at least one path")
    .help();
}
