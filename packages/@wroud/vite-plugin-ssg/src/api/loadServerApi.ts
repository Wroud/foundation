import { fork } from "child_process";
import type { BoundServerApiFunction, IServerAPI } from "../react/server.js";
import type { HtmlTagDescriptor } from "vite";
import { fileURLToPath } from "url";
import type { IAppContext } from "../app.js";

export async function loadServerApi(module: string) {
  const process = fork(
    fileURLToPath(import.meta.resolve("./run-server-api.js")),
    [module],
  );
  let messageId = 0;

  return {
    create: async <T extends IAppContext>(
      ...args: Parameters<BoundServerApiFunction<T>>
    ): Promise<
      Pick<IServerAPI<T>, "render" | "getPathsToPrerender" | "dispose">
    > => {
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

            if (response.success) {
              resolve(response.data);
            } else {
              reject(new Error(response.error || "Unknown error"));
            }
          };

          process.on("message", onMessage);
          process.send({
            type,
            instanceId,
            messageId: id,
            args,
          });
        });
      };

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
      process.kill();
    },
  };
}
