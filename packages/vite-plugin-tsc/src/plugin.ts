import { createLogger, type PluginOption } from "vite";
import colors from "picocolors";
import { execa, type Options, type ResultPromise } from "execa";

const filePathRegex = /^([\w/.-]+)\((\d+),(\d+)\)/g;

interface IOptions {
  tscArgs: string[];
  verbose?: boolean;
}

export function tscPlugin(
  { tscArgs, verbose }: IOptions = {
    tscArgs: [],
  },
): PluginOption {
  const controller = new AbortController();
  const cancelSignal = controller.signal;
  const logger = createLogger("info", { prefix: "[tsc]" });
  let tsProcess: ResultPromise<Options> | null = null;

  const LOG_LEVELS: Record<
    string,
    keyof Pick<typeof logger, "warn" | "info" | "error">
  > = {
    command: "info",
    output: "info",
    ipc: "info",
    error: "error",
    duration: "info",
  };

  const execaOptions: Options = {
    lines: true,
    gracefulCancel: true,
    cancelSignal,
    verbose(verboseLine, { message, type, result }) {
      if (
        ["command", "ipc", "duration"].includes(type as string) ||
        (result as any)?.isGracefullyCanceled
      ) {
        return;
      }

      message = message
        .replaceAll(/(\r\n|\n|\r)/gm, "")
        .replace(/^.*?\s-\s/g, "");

      if (!message || (filterTscMessages(message) && !verbose)) {
        return;
      }

      if (message.includes("error TS")) {
        type = "error";
        message = message.replace("error TS", colors.red("error") + " TS");
      }

      const pathMatch = filePathRegex.exec(message)?.[0];

      if (pathMatch) {
        message = message.replace(
          filePathRegex,
          (match, filePath, line, column) =>
            colors.dim(`${filePath}(${line},${column})`),
        );
      }

      const level: keyof typeof logger =
        LOG_LEVELS[type as keyof typeof LOG_LEVELS] || "info";
      logger[level](message as string, { timestamp: true });
    },
  };

  return {
    name: "vite-plugin-tsc",

    // Hook to check if watch mode is enabled
    async configResolved(config) {
      const isWatchMode = config.command === "serve" || !!config.build.watch;

      if (!isWatchMode) {
        logger.info("building...", {
          timestamp: true,
        });
        await execa("npx", ["tsc", ...tscArgs], execaOptions);
        logger.info("building completed.", {
          timestamp: true,
        });
      } else {
        logger.info("prebuild...", {
          timestamp: true,
        });
        await execa("npx", ["tsc", ...tscArgs], execaOptions);

        if (tsProcess) {
          logger.warn("watch process already running. Skipping...", {
            timestamp: true,
          });
          return;
        }

        tsProcess = execa(
          "npx",
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
    },

    async closeBundle() {
      if (tsProcess) {
        controller.abort();
        await tsProcess.catch(() => {});
        tsProcess = null;
      }
    },
  };
}

function filterTscMessages(message: string) {
  return (
    message.match(/Found \d+ errors\. Watching for file changes/g) ||
    message.match(/File change detected\. Starting incremental compilation/g)
  );
}
