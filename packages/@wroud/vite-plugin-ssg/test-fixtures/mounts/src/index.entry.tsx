import type { IndexComponentProps } from "@wroud/vite-plugin-ssg";
import { Html, Head, Body } from "@wroud/vite-plugin-ssg/react/components";
import { createAppConfig } from "@wroud/vite-plugin-ssg/app";
import { useAppContext } from "@wroud/vite-plugin-ssg/react/components";

function Index({ context }: IndexComponentProps) {
  const app = useAppContext();
  const { pathname } = new URL(context.href ?? "/", "http://localhost/");
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <title>Site</title>
      </Head>
      <Body>
        <h1 data-testid="site">Site</h1>
        <p data-testid="path">{pathname}</p>
        <p data-testid="base">{app.base}</p>
        <a data-testid="admin-link" href="/site/admin/">
          Admin
        </a>
      </Body>
    </Html>
  );
}

export default createAppConfig(Index, {
  onAppStart: (context) => ({ base: context.base ?? "/" }),
  onRoutesPrerender: () => ["/", "/about"],
});
