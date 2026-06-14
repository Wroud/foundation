import type { IndexComponentProps } from "@wroud/vite-plugin-ssg";
import {
  Html,
  Head,
  Body,
  Link,
  Script,
} from "@wroud/vite-plugin-ssg/react/components";

export default function Root({ context }: IndexComponentProps) {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <title>Minimal</title>
        <Link rel="icon" href="/favicon.svg" data-testid="nonced-link" />
        <Script data-testid="inline-script">{"window.__SSG_INLINE = 1;"}</Script>
        <Script src="/plain.js" data-testid="plain-script" />
      </Head>
      <Body>
        <h1 data-testid="minimal">Minimal</h1>
        <p data-testid="nonce">{context.cspNonce}</p>
      </Body>
    </Html>
  );
}
