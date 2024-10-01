#!/usr/bin/env node
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { link } from "./link.js";
import glob from "fast-glob";

await yargs(hideBin(process.argv))
  .scriptName("ts-link")
  .command(
    "glob [patterns..]",
    "Provide a single glob pattern for tsconfig.json locations",
    (yargs) => {
      return yargs
        .positional("patterns", {
          description: "Glob patterns to match tsconfig.json locations",
          type: "string",
          array: true,
          demandOption: true,
        })
        .options({
          immutable: {
            type: "boolean",
            description:
              "Do not modify the tsconfig.json files, will exit with 1 if changes are needed",
          },
          verbose: {
            type: "boolean",
            description: "Print verbose output",
          },
        });
    },
    async ({ patterns, immutable, verbose }) => {
      if (!patterns) {
        console.error("Error: No glob pattern provided");
        process.exit(1);
      }

      const paths = await glob(patterns, { onlyFiles: false });

      if (paths.length === 0) {
        console.error("Error: No paths found");
        process.exit(1);
      }
      await link({ immutable, verbose }, ...paths);
    },
  )
  .command(
    ["link [paths..]", "* [paths..]"],
    "link ts project references",
    (yargs) => {
      return yargs
        .positional("paths", {
          description: "Paths to tsconfig.json locations",
          type: "string",
          array: true,
        })
        .options({
          immutable: {
            type: "boolean",
            description:
              "Do not modify the tsconfig.json files, will exit with 1 if changes are needed",
          },
          verbose: {
            type: "boolean",
            description: "Print verbose output",
          },
        });
    },
    async ({ paths, immutable, verbose }) => {
      if (!paths || paths.length === 0) {
        console.error("Error: No paths provided");
        process.exit(1);
      }
      await link({ immutable, verbose }, ...paths);
    },
  )
  .strict()
  .demandCommand(0, "You need to provide at least one path")
  .help()
  .parse();
