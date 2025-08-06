import {
  createLogger,
  type ErrorPayload,
  type PluginOption,
  type ViteDevServer,
} from "vite";
import colors from "picocolors";
import stripAnsi from "strip-ansi";
import { Worker } from "node:worker_threads";

interface IOptions {
  tscArgs: string[];
  verbose?: boolean;
  prebuild?: boolean;
  enableOverlay?: boolean;
}

const pluginName = "vite-plugin-tsc";

export function tscPlugin(
  { tscArgs, verbose, prebuild, enableOverlay }: IOptions = {
    tscArgs: [],
  },
): PluginOption {
  let server: ViteDevServer | null = null;
  const logger = createLogger("info", { prefix: "[tsc]" });
  let tsWorker: Worker | null = null;
  let isPrebuilt = false;
  let isWatchMode = false;

  function handleWorkerMessage(message: any) {
    try {
      if (message.type === "diagnostic") {
        let { message: msg, category, file, line, column, code } = message;
        let loc: ErrorPayload["err"]["loc"] | undefined;
        if (file) {
          loc = { file, line, column };
          msg = colors.dim(`${file}(${line},${column})`) + "\n" + msg;
        }
        msg = colors.dim(`TS${code}:`) + ` ${msg}`;
        if (category === "error" && enableOverlay) {
          server?.ws.send({
            type: "error",
            err: {
              message: stripAnsi(msg),
              stack: "",
              loc,
              plugin: pluginName,
            },
          });
        }
        const level =
          category === "error"
            ? "error"
            : category === "warning"
              ? "warn"
              : "info";
        logger[level](msg, { timestamp: true });
      } else if (message.type === "status") {
        let msg = message.message.replace(/(\r\n|\n|\r)/gm, "");
        if (!msg || (filterTscMessages(msg) && !verbose)) {
          return;
        }
        logger.info(msg, { timestamp: true });
      }
    } catch (e: any) {
      logger.error("Error while parsing tsc worker message", {
        timestamp: true,
        error: e,
      });
    }
  }

  function startWorker(
    watch: boolean,
    runPrebuild: boolean,
    onBuilt?: (success: boolean) => void,
  ) {
    const { resolve, reject, promise } = Promise.withResolvers<void>();
    const worker = new Worker(new URL("./worker.js", import.meta.url), {
      workerData: { tscArgs, watch, prebuild: runPrebuild },
      type: "module",
    } as any);
    if (watch) {
      tsWorker = worker;
    }
    worker.on("message", (m) => {
      handleWorkerMessage(m);
      if (m.type === "built" && onBuilt) {
        onBuilt(m.success);
      }
    });
    worker.on("error", (e) => {
      logger.error("TSC worker error", { timestamp: true, error: e });
    });
    worker.on("exit", (code) => {
      if (tsWorker === worker) tsWorker = null;
      if (code !== 0) {
        reject(new Error(`TSC worker exited with code ${code}`));
      } else {
        resolve();
      }
    });

    return promise;
  }

  async function run() {
    if ((prebuild || !isWatchMode) && !isPrebuilt) {
      const timestamp = Date.now();
      try {
        logger.info(isWatchMode ? "prebuild..." : "building...", {
          timestamp: true,
        });
        await startWorker(false, true);
      } catch (e) {
        if (!isWatchMode) {
          throw e;
        }
      } finally {
        isPrebuilt = true;
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
      if (tsWorker) {
        logger.warn("watch process already running. Skipping...", {
          timestamp: true,
        });
        return;
      }
      startWorker(true, false);
    }
  }

  const plugin: PluginOption = {
    name: pluginName,
    enforce: "pre",

    async configResolved(config) {
      isWatchMode = config.command === "serve" || !!config.build.watch;
    },

    buildStart: {
      order: "pre",
      sequential: true,
      async handler() {
        await run();
      },
    },

    configureServer(devServer) {
      server = devServer;
    },

    async closeBundle() {
      if (tsWorker) {
        await tsWorker.terminate();
        tsWorker = null;
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
    // message.match(/Found \d+ errors?\. Watching for file changes/g) ||
    message.match(/File change detected\. Starting incremental compilation/g) ||
    message.match(/Starting compilation in watch mode/g) ||
    message.match(/Command failed with exit code/g)
  );
}
