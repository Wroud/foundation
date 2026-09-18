import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { initTsProject } from "./templates/project/initTsProject.js";
import { initTsConfig } from "./templates/tsconfig/initTsConfig.js";
import { ES_TARGETS } from "./ES_TARGETS.js";
import { parsePackageName } from "./parsePackageName.js";
import { getDefaultProjectName } from "./getDefaultProjectName.js";
import { reportCliErrors } from "./CliError.js";
import { prepareTarget } from "./prepareTarget.js";

export function configureYargs(args: string[], cwd?: string) {
  const defaultName = getDefaultProjectName();
  const cli = yargs(hideBin(args), cwd);

  return cli
    .scriptName("ts-template")
    .command(
      "tsconfig [name]",
      "Create a base tsconfig package in the current directory",
      (yargs) => {
        return yargs
          .positional("name", {
            describe:
              "Package name to write to package.json (defaults to one derived from the current directory). It does not select the target directory",
            type: "string",
            default: defaultName,
          })
          .options({
            immutable: {
              alias: "i",
              type: "boolean",
              description: "Do not modify files, just print what would be done",
              default: false,
            },
            force: {
              alias: "f",
              type: "boolean",
              description:
                "Modify an existing package.json/tsconfig.json in the current directory without asking",
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
      async ({ name, target, immutable, force, verbose }) => {
        await reportCliErrors(async () => {
          const path = process.cwd();
          const packageName = parsePackageName(name);
          const manifest = await prepareTarget({
            path,
            packageName,
            explicitName: name !== defaultName,
            args: hideBin(args),
            packageJsonChanges: `set the package.json name to "${packageName.packageName}"`,
            immutable,
            force,
          });

          await initTsConfig({
            path,
            packageName,
            manifest,
            target,
            immutable,
            verbose,
          });
        });
      },
    )
    .command(
      "project [name]",
      "Create a TypeScript project in the current directory that extends a base tsconfig package",
      (yargs) => {
        return yargs
          .positional("name", {
            describe:
              "Package name to write to package.json (defaults to one derived from the current directory). It does not select the target directory",
            type: "string",
            default: defaultName,
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
            force: {
              alias: "f",
              type: "boolean",
              description:
                "Modify an existing package.json/tsconfig.json in the current directory without asking",
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
      async ({ name, tsconfig, target, immutable, force, verbose }) => {
        await reportCliErrors(async () => {
          const path = process.cwd();
          const packageName = parsePackageName(name);
          const tsConfigName = parsePackageName(tsconfig, packageName.scope);
          const manifest = await prepareTarget({
            path,
            packageName,
            explicitName: name !== defaultName,
            args: hideBin(args),
            packageJsonChanges: `update package.json (name "${packageName.packageName}", type, exports, files, scripts.clear, devDependencies)`,
            immutable,
            force,
          });

          await initTsProject({
            path,
            packageName,
            tsconfig: tsConfigName,
            manifest,
            target,
            immutable,
            verbose,
          });
        });
      },
    )
    .strict()
    .demandCommand(1, "Specify a command: project or tsconfig")
    .epilog(
      "ts-template always scaffolds the current directory. Create the package folder and run it from inside; in a Yarn workspace use `yarn run -T ts-template ...` so the root workspace's binary is found. Existing package.json and tsconfig.json files are only modified after confirmation, or with --force when not attached to a terminal. Workspace roots are never scaffolded.",
    )
    .wrap(cli.terminalWidth())
    .help();
}
