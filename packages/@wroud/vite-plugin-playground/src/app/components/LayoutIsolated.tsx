import type { IndexComponentProps } from "@wroud/vite-plugin-ssg";
import { Html, Body, Head } from "@wroud/vite-plugin-ssg/react/components";

interface Props extends IndexComponentProps {
  children?: React.ReactNode;
}

export function LayoutIsolated({ children }: Props) {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Playground</title>
      </Head>
      <Body style={{ margin: 0 }}>{children}</Body>
    </Html>
  );
}
