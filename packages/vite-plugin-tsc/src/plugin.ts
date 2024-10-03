import {
  createLogger,
  type ErrorPayload,
  type PluginOption,
  type ViteDevServer,
} from "vite";
import colors from "picocolors";
import { execa, type Options, type ResultPromise } from "execa";
import { detect } from "detect-package-manager";

const filePathRegex = /^([\w/.-]+)\((\d+),(\d+)\)/g;

interface IOptions {
  tscArgs: string[];
  verbose?: boolean;
  prebuild?: boolean;
}

const pluginName = "vite-plugin-tsc";

export function tscPlugin(
  { tscArgs, verbose, prebuild }: IOptions = {
    tscArgs: [],
  },
): PluginOption {
  let server: ViteDevServer | null = null;
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

      const pathMatch = filePathRegex.exec(message);
      let loc: ErrorPayload["err"]["loc"] | undefined = undefined;

      if (pathMatch) {
        const [, filePath, line, column] = pathMatch;
        try {
          loc = {
            file: filePath,
            line: parseInt(line || "0", 10),
            column: parseInt(column || "0", 10),
          };
        } catch {}

        message = message.replace(
          filePathRegex,
          (match, filePath, line, column) =>
            colors.dim(`${filePath}(${line},${column})`),
        );
      }

      if (type === "error") {
        server?.ws.send("vite:error", {
          type: "error",
          err: {
            message,
            stack: "",
            loc,
            plugin: pluginName,
          },
        });
      }

      const level: keyof typeof logger =
        LOG_LEVELS[type as keyof typeof LOG_LEVELS] || "info";
      logger[level](message as string, { timestamp: true });
    },
  };

  return {
    name: pluginName,

    // Hook to check if watch mode is enabled
    async configResolved(config) {
      const packageManager = await detect();
      const isWatchMode = config.command === "serve" || !!config.build.watch;

      if (prebuild || !isWatchMode) {
        const timestamp = Date.now();
        try {
          logger.info(isWatchMode ? "prebuild..." : "building...", {
            timestamp: true,
          });
          await execa(packageManager, ["tsc", ...tscArgs], execaOptions);
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
    },

    configureServer(devServer) {
      server = devServer;
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
    message.match(/Found \d+ errors?\. Watching for file changes/g) ||
    message.match(/File change detected\. Starting incremental compilation/g) ||
    message.match(/Starting compilation in watch mode/g)
  );
}
