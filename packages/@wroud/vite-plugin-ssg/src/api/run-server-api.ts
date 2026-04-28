import { registerAssetResolver } from "@wroud/vite-plugin-asset-resolver/node-loader-register";
import { serializeError } from "../utils/error/serializeError.js";
import type { IAppContext } from "../app.js";
import type { IServerAPI } from "../react/server.js";

registerAssetResolver();

const [serverModulePath] = process.argv.slice(2);

let instances: Record<number, IServerAPI<IAppContext>> = {};
let instanceId = 0;

function requireInstance(id: number) {
  const instance = instances[id];
  if (!instance) {
    throw new Error(`Instance not found: ${id}`);
  }
  return instance;
}

try {
  const { create } = await import(serverModulePath!);

  process.on("message", async (message: any) => {
    const { type, messageId } = message;

    try {
      switch (type) {
        case "init":
          const api = await create(...message.args);
          instances[instanceId] = api;
          process.send?.({ messageId, data: instanceId, success: true });
          instanceId++;
          break;

        case "render":
          const { htmlTags, timeout } = message.args;
          const html = await requireInstance(message.instanceId).render(
            htmlTags,
            timeout,
          );
          process.send?.({ messageId, success: true, data: html });
          break;

        case "getPathsToPrerender":
          const paths =
            await requireInstance(message.instanceId).getPathsToPrerender();
          process.send?.({ messageId, success: true, data: paths });
          break;

        case "dispose":
          if (message.instanceId !== undefined) {
            await requireInstance(message.instanceId).dispose();
            delete instances[message.instanceId];
          } else {
            for (const id in instances) {
              await instances[id]?.dispose();
            }
            instances = {};
          }
          process.send?.({ messageId, success: true });
          break;

        default:
          process.send?.({
            messageId,
            success: false,
            error: `Unknown message type: ${type}`,
          });
      }
    } catch (error) {
      process.send?.({
        messageId,
        success: false,
        error: serializeError(error),
      });
    }
  });
} catch (err) {
  console.error("[runner error]", err);
  process.exit(1);
}
