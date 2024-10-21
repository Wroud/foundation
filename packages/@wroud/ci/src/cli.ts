#!/usr/bin/env node
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { makeRelease } from "./makeRelease.js";
import { createReleaseTag } from "./createReleaseTag.js";
import { publishGithubRelease } from "./publishGithubRelease.js";
import { createActionAuth } from "@octokit/auth-action";

await yargs(hideBin(process.argv))
  .command(
    "release [path]",
    "bump version and update changelog",
    (yargs) => {
      return yargs
        .options({
          prefix: {
            type: "string",
            description: "tag prefix",
          },
          changeLogFile: {
            type: "string",
            description: "path to changelog file",
          },
          dryRun: {
            type: "boolean",
            description: "run without making changes",
          },
        })
        .positional("path", {
          type: "string",
          description: "path to git repository",
          default: undefined,
        });
    },
    async (argv) => {
      await makeRelease({
        prefix: argv.prefix,
        changeLogFile: argv.changeLogFile,
        dryRun: argv.dryRun,
        path: argv.path,
      });
    },
  )
  .command(
    "git-tag",
    "create release tag",
    (yargs) => {
      return yargs
        .options({
          prefix: {
            type: "string",
            description: "tag prefix",
          },
          dryRun: {
            type: "boolean",
            description: "run without making changes",
          },
        })
        .positional("path", {
          type: "string",
          description: "path to git repository",
          default: undefined,
        });
    },
    async (argv) => {
      await createReleaseTag({
        prefix: argv.prefix,
        dryRun: argv.dryRun,
      });
    },
  )
  .command(
    "release-github",
    "create github release",
    (yargs) => {
      return yargs.options({
        prefix: {
          type: "string",
          description: "tag prefix",
        },
        dryRun: {
          type: "boolean",
          description: "run without making changes",
        },
      });
    },
    async (argv) => {
      const dryRun = argv.dryRun;

      const [owner, repository] =
        process.env["GITHUB_REPOSITORY"]?.split("/") ??
        (dryRun ? ["owner", "repo"] : []);

      if (!owner || !repository) {
        throw new Error("GITHUB_REPOSITORY environment variable is required");
      }

      let authStrategy;

      if (!dryRun) {
        authStrategy = createActionAuth;
      } else {
        authStrategy = undefined;
      }

      await publishGithubRelease({
        authStrategy,
        owner,
        repository,
        prefix: argv.prefix,
        dryRun,
      });
    },
  )
  .demandCommand(1)
  .parse();
