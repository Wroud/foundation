import { createLogger, type PluginOption, type ViteDevServer } from "vite";
import colors from "picocolors";
import stripAnsi from "strip-ansi";
import { Worker } from "node:worker_threads";
import {
  resolveNativeCompiler,
  startNative,
  type NativeCompiler,
} from "./native.js";
import type { TscMessage } from "./parseTscOutput.js";

interface IOptions {
  tscArgs?: string[];
  verbose?: boolean;
  prebuild?: boolean;
  enableOverlay?: boolean;
  tsgo?: boolean;
}

interface Runner {
  exited: Promise<number>;
  stop(): Promise<void>;
}

const pluginName = "vite-plugin-tsc";

export function tscPlugin({
  tscArgs = ["-b"],
  verbose,
  prebuild = true,
  enableOverlay,
  tsgo,
}: IOptions = {}): PluginOption {
  let server: ViteDevServer | null = null;
  const logger = createLogger("info", { prefix: "[tsc]" });
  let nativeCompiler: Promise<NativeCompiler | null> | null = null;
  let tsRunner: Runner | null = null;
  let isPrebuilt = false;
  let isWatchMode = false;

  function handleMessage(message: TscMessage) {
    try {
      if (message.type === "diagnostic") {
        let { message: msg, category, loc, code } = message;
        if (loc) {
          msg =
            colors.dim(`${loc.file}(${loc.line},${loc.column})`) + "\n" + msg;
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

  function startWorker(watch: boolean): Runner {
    const worker = new Worker(new URL("./worker.js", import.meta.url), {
      workerData: { tscArgs, watch },
      type: "module",
    } as any);
    worker.on("message", handleMessage);
    worker.on("error", (e) => {
      logger.error("TSC worker error", { timestamp: true, error: e });
    });
    const exited = new Promise<number>((resolve) => {
      worker.on("exit", resolve);
    });

    return {
      exited,
      async stop() {
        await worker.terminate();
      },
    };
  }

  function resolveCompiler() {
    return (nativeCompiler ??= resolveNativeCompiler(tsgo).then((compiler) => {
      if (verbose && compiler) {
        logger.info(
          `using ${compiler.name}@${compiler.version} native compiler`,
          { timestamp: true },
        );
      }
      return compiler;
    }));
  }

  async function start(compiler: NativeCompiler | null, watch: boolean) {
    const runner = compiler
      ? startNative(compiler, tscArgs, watch, handleMessage, (message) =>
          logger.error(message.trimEnd(), { timestamp: true }),
        )
      : startWorker(watch);
    if (watch) {
      tsRunner = runner;
    }

    const code = await runner.exited;
    const stopped = watch && tsRunner !== runner;
    if (tsRunner === runner) tsRunner = null;
    if (!stopped && code !== 0) {
      throw new Error(`TSC exited with code ${code}`);
    }
  }

  async function run() {
    const compiler = await resolveCompiler();
    if ((prebuild || !isWatchMode) && !isPrebuilt) {
      const timestamp = Date.now();
      try {
        logger.info(isWatchMode ? "prebuild..." : "building...", {
          timestamp: true,
        });
        await start(compiler, false);
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
      if (tsRunner) {
        logger.warn("watch process already running. Skipping...", {
          timestamp: true,
        });
        return;
      }
      start(compiler, true).catch((e) => {
        logger.error("TSC watch worker crashed", {
          timestamp: true,
          error: e,
        });
      });
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
      const runner = tsRunner;
      tsRunner = null;
      await runner?.stop();
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
