import type { IndexComponentProps } from "@wroud/vite-plugin-ssg";
import {
  Html,
  Head,
  Body,
  Script,
} from "@wroud/vite-plugin-ssg/react/components";

export default function Root(_props: IndexComponentProps) {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <title>CSP Header</title>
        <Script data-testid="inline-script">{"window.__SSG_HEADER = 1;"}</Script>
      </Head>
      <Body>
        <h1 data-testid="csp-header">CSP Header</h1>
      </Body>
    </Html>
  );
}
