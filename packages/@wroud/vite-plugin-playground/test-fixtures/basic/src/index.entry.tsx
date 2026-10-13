import type { IndexComponentProps } from "@wroud/vite-plugin-ssg";
import { Html, Head, Body } from "@wroud/vite-plugin-ssg/react/components";

export default function Site({ context }: IndexComponentProps) {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <title>Site</title>
      </Head>
      <Body>
        <h1 data-testid="site">Site</h1>
        <p data-testid="base">{context.base}</p>
        <a href="playground/">Playground</a>
      </Body>
    </Html>
  );
}
