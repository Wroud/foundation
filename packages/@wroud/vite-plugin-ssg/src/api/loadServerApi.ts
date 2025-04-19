import { fork } from "child_process";
import type { BoundServerApiFunction, IServerAPI } from "../react/server.js";
import type { HtmlTagDescriptor } from "vite";
import { fileURLToPath } from "url";
import type { IAppContext } from "../app.js";
import { deserializeError } from "../utils/error/deserializeError.js";

export async function loadServerApi(module: string) {
  let process = fork(
    fileURLToPath(import.meta.resolve("./run-server-api.js")),
    [module],
  );
  let messageId = 0;

  const activeListeners = new Set<(message: any) => void>();

  // Helper function to send message and wait for response
  const sendMessageAndWaitForResponse = (
    type: "init" | "render" | "getPathsToPrerender" | "dispose",
    instanceId?: number,
    args?: any,
  ): Promise<any> => {
    return new Promise((resolve, reject) => {
      const id = messageId++;

      const onMessage = (response: any) => {
        if (response.messageId !== id) return;

        process.removeListener("message", onMessage);
        activeListeners.delete(onMessage);

        if (response.success) {
          resolve(response.data);
        } else {
          reject(deserializeError(response.error));
        }
      };

      activeListeners.add(onMessage);
      process.on("message", onMessage);
      process.send({
        type,
        instanceId,
        messageId: id,
        args,
      });
    });
  };

  return {
    create: async <T extends IAppContext>(
      ...args: Parameters<BoundServerApiFunction<T>>
    ): Promise<
      Pick<IServerAPI<T>, "render" | "getPathsToPrerender" | "dispose">
    > => {
      const instanceId = await sendMessageAndWaitForResponse(
        "init",
        undefined,
        args,
      );

      return {
        async render(
          htmlTags: HtmlTagDescriptor[],
          timeout?: number,
        ): Promise<string> {
          return sendMessageAndWaitForResponse("render", instanceId, {
            htmlTags,
            timeout,
          });
        },
        async getPathsToPrerender(): Promise<string[]> {
          return sendMessageAndWaitForResponse(
            "getPathsToPrerender",
            instanceId,
          );
        },
        async dispose() {
          await sendMessageAndWaitForResponse("dispose", instanceId);
        },
      };
    },
    async dispose() {
      if (!process) {
        return;
      }
      try {
        // First try to gracefully terminate by notifying the child process
        await sendMessageAndWaitForResponse("dispose", undefined);

        // Clean up any remaining listeners to prevent memory leaks
        for (const listener of activeListeners) {
          process.removeListener("message", listener);
        }
        activeListeners.clear();

        // Check if the process is still running
        if (process.connected) {
          // Try SIGTERM first for graceful shutdown
          process.kill("SIGTERM");

          // Set a timeout to force kill if the process doesn't exit
          await new Promise((resolve, reject) =>
            setTimeout(() => {
              try {
                if (!process.killed) {
                  process.kill("SIGKILL");
                }
              } catch (e) {
                reject(e);
              } finally {
                resolve(undefined);
              }
            }, 500),
          );
        }
      } catch (error) {
        console.error("Error disposing server process:", error);
        // Force kill as a last resort
        if (process.connected && !process.killed) {
          process.kill("SIGKILL");
        }
      } finally {
        process = null as any;
      }
    },
  };
}
