import type { IndexComponentProps } from "@wroud/vite-plugin-ssg";
import { Html, Head, Body } from "@wroud/vite-plugin-ssg/react/components";
import { createAppConfig } from "@wroud/vite-plugin-ssg/app";
import { useAppContext } from "@wroud/vite-plugin-ssg/react/components";
import { AdminCounter } from "./counter.js";

function Admin({ context }: IndexComponentProps) {
  const app = useAppContext();
  const { pathname } = new URL(context.href ?? "/", "http://localhost/");
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <title>Admin</title>
      </Head>
      <Body>
        <h1 data-testid="admin">Admin</h1>
        <p data-testid="path">{pathname}</p>
        <p data-testid="base">{app.base}</p>
        <AdminCounter />
      </Body>
    </Html>
  );
}

export default createAppConfig(Admin, {
  onAppStart: (context) => ({ base: context.base ?? "/" }),
  onRoutesPrerender: () => ["/", "/users"],
  onResponse: () => ({ headers: { "x-mount": "admin" } }),
});
