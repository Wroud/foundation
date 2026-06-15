import type { IndexComponentProps } from "@wroud/vite-plugin-ssg";
import { createAppConfig } from "@wroud/vite-plugin-ssg/app";
import {
  Html,
  Head,
  Body,
  Link,
  Script,
} from "@wroud/vite-plugin-ssg/react/components";

function Root({ context }: IndexComponentProps) {
  const { pathname } = new URL(context.href ?? "/", "http://localhost/");
  const nested = pathname === "/blog/post";
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <title>{nested ? "Post" : "CSP Hash"}</title>
        <Link rel="icon" href="/favicon.svg" data-testid="icon" />
        <Script data-testid="inline-script">
          {nested ? "window.__SSG_POST = 2;" : "window.__SSG_INLINE = 1;"}
        </Script>
        <Script src="/plain.js" data-testid="plain-script" />
      </Head>
      <Body>
        <h1 data-testid="csp-hash">{nested ? "Post" : "CSP Hash"}</h1>
        <p data-testid="path">{pathname}</p>
        <p data-testid="nonce">{context.cspNonce ?? "no-nonce"}</p>
      </Body>
    </Html>
  );
}

export default createAppConfig(Root, {
  onRoutesPrerender: () => ["/", "/blog/post"],
});
