import type { RscEntryProps } from "@wroud/vite-plugin-ssg";
import { Link, Script } from "@wroud/vite-plugin-ssg/react/components";
import { createRscConfig } from "@wroud/vite-plugin-ssg/app";
import { ServerDataProvider } from "./server-data.js";

interface IRscApp {
  base: string;
  serverData: string;
  secret: string;
}

async function RscRoot({ app, children }: RscEntryProps<IRscApp>) {
  const serverData = await Promise.resolve(app.serverData);
  return (
    <ServerDataProvider value={serverData}>
      <Link rel="icon" href="/server.svg" data-testid="basic-server-link" />
      <Script async src="/server.js" data-testid="basic-server-script" />
      {children}
    </ServerDataProvider>
  );
}

export default createRscConfig(RscRoot, {
  onAppStart: (context) => ({
    base: context.base ?? "/",
    serverData: "from-server",
    secret: "server-secret",
  }),
});
