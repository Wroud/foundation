import type { IndexComponentProps } from "@wroud/vite-plugin-ssg";
import { Html, Head, Body } from "@wroud/vite-plugin-ssg/react/components";
import { createAppConfig, type IAppContext } from "@wroud/vite-plugin-ssg/app";
import { useAppContext } from "@wroud/vite-plugin-ssg/react/components";
import {
  createService,
  ServiceContainerBuilder,
  type IServiceProvider,
} from "@wroud/di";
import { ServiceProvider } from "@wroud/di-react";
import { useServiceSync } from "@wroud/di-react/useServiceSync.js";
import { AppData } from "./app-data.js";
import { Counter } from "./counter.js";
import { useServerData } from "./server-data.js";
import "./index.css";

interface IGreeting {
  message: string;
}

const IGreeting = createService<IGreeting>("IGreeting");

interface IApp extends IAppContext {
  source: string;
  ssrFetch: string;
  provider: IServiceProvider;
}

function Greeting() {
  const greeting = useServiceSync(IGreeting);
  return <p data-testid="di">{greeting.message}</p>;
}

function DiPage() {
  const app = useAppContext<IApp>();
  return (
    <ServiceProvider provider={app.provider}>
      <Greeting />
    </ServiceProvider>
  );
}

function Index({ context }: IndexComponentProps) {
  const { pathname } = new URL(context.href ?? "/", "http://localhost/");
  const serverData = useServerData();
  const app = useAppContext<IApp>();

  if (pathname === "/profile") {
    return (
      <Html lang="en">
        <Head>
          <meta charSet="utf-8" />
          <title>Profile</title>
        </Head>
        <Body>
          <h1 data-testid="profile">Profile page</h1>
          <a href="/">Home</a>
        </Body>
      </Html>
    );
  }

  if (pathname === "/di") {
    return (
      <Html lang="en">
        <Head>
          <meta charSet="utf-8" />
          <title>DI</title>
        </Head>
        <Body>
          <DiPage />
        </Body>
      </Html>
    );
  }

  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <title>{`Home ${pathname}`}</title>
      </Head>
      <Body>
        <h1>Home</h1>
        <p data-testid="path">{pathname}</p>
        <p data-testid="server-data">{serverData}</p>
        <p data-testid="ssr-fetch" suppressHydrationWarning>
          {app.ssrFetch}
        </p>
        <Counter />
        <AppData />
        <a data-testid="profile-link" href="/profile">
          Profile
        </a>
      </Body>
    </Html>
  );
}

export default createAppConfig(Index, {
  onAppStart: async (context) => {
    let ssrFetch = "n/a";
    if (import.meta.env.DEV && typeof window === "undefined") {
      ssrFetch = await (await fetch("/__ping")).text();
    }
    return {
      base: context.base ?? "/",
      source: "client-start",
      ssrFetch,
      provider: new ServiceContainerBuilder()
        .addSingleton(IGreeting, () => ({ message: "from-di" }))
        .build(),
    };
  },
  onRoutesPrerender: () => ["/", "/about", "/profile", "/di"],
  onAppStop: () => {
    (globalThis as Record<string, unknown>)["__SSG_APP_STOPPED"] = true;
  },
});
