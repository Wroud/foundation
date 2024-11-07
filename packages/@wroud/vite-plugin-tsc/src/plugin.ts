import {
  createLogger,
  type ErrorPayload,
  type PluginOption,
  type ViteDevServer,
} from "vite";
import colors from "picocolors";
import stripAnsi from "strip-ansi";
import { execa, type Options, type ResultPromise } from "execa";
import { detect, type PM } from "detect-package-manager";
import { createProblemMatcher } from "./problemMatcher.js";

interface IOptions {
  tscArgs: string[];
  verbose?: boolean;
  prebuild?: boolean;
  enableOverlay?: boolean;
  packageManager?: PM;
}

const pluginName = "vite-plugin-tsc";

export function tscPlugin(
  { tscArgs, verbose, prebuild, enableOverlay, packageManager }: IOptions = {
    tscArgs: [],
  },
): PluginOption {
  let server: ViteDevServer | null = null;
  const logger = createLogger("info", { prefix: "[tsc]" });
  let tsProcess: ResultPromise<Options> | null = null;
  let isPrebuilt = false;
  let isWatchMode = false;

  const LOG_LEVELS: Record<
    string,
    keyof Pick<typeof logger, "warn" | "info" | "error">
  > = {
    command: "info",
    output: "info",
    ipc: "info",
    duration: "info",
    error: "error",
    warn: "warn",
    info: "info",
  };

  const tscProblemMatch = createProblemMatcher();

  const execaOptions: Options = {
    lines: true,
    verbose(verboseLine, { message, type, result }) {
      try {
        if (
          ["command", "ipc", "duration"].includes(type as string) ||
          (result as any)?.isGracefullyCanceled
        ) {
          return;
        }

        const tscProblem = tscProblemMatch(message);
        let loc: ErrorPayload["err"]["loc"] | undefined;

        if (tscProblem) {
          loc = {
            file: tscProblem.file,
            line: tscProblem.line,
            column: tscProblem.column,
          };
          type = tscProblem.severity as any;
          message =
            colors.dim(`TS${tscProblem.code}:`) + ` ${tscProblem.message}`;
        } else {
          message = message
            .replaceAll(/(\r\n|\n|\r)/gm, "")
            .replace(/^.*?\s-\s/g, "");
        }

        if (!message || (filterTscMessages(message) && !verbose)) {
          return;
        }

        if (type === "error" && enableOverlay) {
          server?.ws.send({
            type: "error",
            err: {
              message: stripAnsi(message),
              stack: "",
              loc,
              plugin: pluginName,
            },
          });
        }

        const level: keyof typeof logger =
          LOG_LEVELS[type as keyof typeof LOG_LEVELS] || "info";
        if (loc) {
          message =
            colors.dim(`${loc.file}(${loc.line},${loc.column})`) +
            "\n" +
            message;
        }
        logger[level](message as string, { timestamp: true });
      } catch (e: any) {
        logger.error("Error while parsing tsc output", {
          timestamp: true,
          error: e,
        });
      }
    },
  };
  async function run() {
    if (!packageManager) {
      logger.warn("packageManager is not detected. Skipping...", {
        timestamp: true,
      });
      return;
    }
    if ((prebuild || !isWatchMode) && !isPrebuilt) {
      const timestamp = Date.now();
      try {
        logger.info(isWatchMode ? "prebuild..." : "building...", {
          timestamp: true,
        });
        await execa(packageManager, ["tsc", ...tscArgs], execaOptions);
        isPrebuilt = true;
      } catch (e) {
        if (!isWatchMode) {
          throw e;
        }
      } finally {
        logger.info(
          isWatchMode
            ? `prebuild completed in ${Date.now() - timestamp}ms.`
            : `build completed in ${Date.now() - timestamp}ms.`,
          {
            timestamp: true,
          },
        );
      }
    }

    if (isWatchMode) {
      if (tsProcess) {
        logger.warn("watch process already running. Skipping...", {
          timestamp: true,
        });
        return;
      }

      tsProcess = execa(
        packageManager,
        ["tsc", ...tscArgs, "--watch", "--preserveWatchOutput"],
        execaOptions,
      );

      tsProcess.catch((error) => {
        logger.error("kill.", {
          timestamp: true,
        });
        if (!error.isGracefullyCanceled) {
          logger.error("watch process failed.", {
            timestamp: true,
            error,
          });
        }
      });
    }
  }

  const plugin: PluginOption = {
    name: pluginName,

    // Hook to check if watch mode is enabled
    async configResolved(config) {
      if (!packageManager) {
        packageManager = await detect();
      }

      isWatchMode = config.command === "serve" || !!config.build.watch;
    },

    async buildStart() {
      await run();
    },

    configureServer(devServer) {
      server = devServer;
    },

    async closeBundle() {
      if (tsProcess) {
        tsProcess.kill();
        await tsProcess.catch(() => {});
        tsProcess = null;
      }
    },
  };

  // TODO: replace it with direct declaration in vite 6
  Object.assign(plugin, {
    sharedDuringBuild: true,
  });

  return plugin;
}

function filterTscMessages(message: string) {
  return (
    message.match(/Found \d+ errors?\. Watching for file changes/g) ||
    message.match(/File change detected\. Starting incremental compilation/g) ||
    message.match(/Starting compilation in watch mode/g) ||
    message.match(/Command failed with exit code/g)
  );
}
