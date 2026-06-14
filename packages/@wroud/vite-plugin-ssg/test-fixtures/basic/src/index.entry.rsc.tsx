import type { RscEntryProps } from "@wroud/vite-plugin-ssg";
import { createRscConfig } from "@wroud/vite-plugin-ssg/app";
import { ServerDataProvider } from "./server-data.js";

interface IRscApp {
  base: string;
  serverData: string;
  secret: string;
}

async function RscRoot({ app, children }: RscEntryProps<IRscApp>) {
  const serverData = await Promise.resolve(app.serverData);
  return <ServerDataProvider value={serverData}>{children}</ServerDataProvider>;
}

export default createRscConfig(RscRoot, {
  onAppStart: (context) => ({
    base: context.base ?? "/",
    serverData: "from-server",
    secret: "server-secret",
  }),
});
