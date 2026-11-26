import { Html, Head, Body } from "@wroud/vite-plugin-ssg/react/components";

export default function Site() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Foundation</title>
      </Head>
      <Body>
        <a href="playground/">Playground</a>
      </Body>
    </Html>
  );
}
