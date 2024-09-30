#!/usr/bin/env node
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { link } from "./link.js";
import glob from "fast-glob";

await yargs(hideBin(process.argv))
  .command(
    "glob [patterns..]",
    "Provide a single glob pattern for tsconfig.json locations",
    (yargs) => {
      return yargs.positional("patterns", {
        description: "Glob patterns to match tsconfig.json locations",
        type: "string",
        array: true,
        demandOption: true,
      });
    },
    async (argv) => {
      const { patterns } = argv;
      if (!patterns) {
        console.error("Error: No glob pattern provided");
        process.exit(1);
      }

      const paths = await glob(patterns, { onlyFiles: false });

      if (paths.length === 0) {
        console.error("Error: No paths found");
        process.exit(1);
      }
      await link({}, ...paths);
    },
  )
  .command(
    ["link [paths..]", "* [paths..]"],
    "link ts project references",
    (yargs) => {
      return yargs.positional("paths", {
        description: "Paths to tsconfig.json locations",
        type: "string",
        array: true,
      });
    },
    async (argv) => {
      if (!argv.paths || argv.paths.length === 0) {
        console.error("Error: No paths provided");
        process.exit(1);
      }
      await link({}, ...argv.paths);
    },
  )
  .strict()
  .demandCommand(0, "You need to provide at least one path")
  .help()
  .parse();
