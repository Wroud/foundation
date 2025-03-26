const [serverModulePath] = process.argv.slice(2);

const instances: Record<number, any> = {};
let instanceId = 0;

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
          const html = await instances[message.instanceId].render(
            htmlTags,
            timeout,
          );
          process.send?.({ messageId, success: true, data: html });
          break;

        case "getPathsToPrerender":
          const paths =
            await instances[message.instanceId].getPathsToPrerender();
          process.send?.({ messageId, success: true, data: paths });
          break;

        case "dispose":
          await instances[message.instanceId].dispose();
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
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });
} catch (err) {
  console.error("[runner error]", err);
  process.exit(1);
}
