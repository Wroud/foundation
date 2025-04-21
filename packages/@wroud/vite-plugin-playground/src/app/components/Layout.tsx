import type { IndexComponentProps } from "@wroud/vite-plugin-ssg";
import {
  Html,
  Body,
  Head,
  Link,
} from "@wroud/vite-plugin-ssg/react/components";
import indexStyles from "./Layout.css?url";
import { Theme } from "./Theme.js";
import { useTheme } from "../useTheme.js";
import logo from "./logo.svg?no-inline";

interface Props extends IndexComponentProps {
  children?: React.ReactNode;
}

export function Layout({ children }: Props) {
  const theme = useTheme();

  return (
    <Theme value={theme}>
      <Html
        lang="en"
        className={
          theme.theme === "light" ? "twp:h-full light" : "twp:h-full dark"
        }
        style={{
          colorScheme: theme.theme,
        }}
      >
        <Head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Playground</title>
          <Link rel="icon" type="image/svg+xml" href={logo} />
          <Link rel="stylesheet" href={indexStyles} />
        </Head>
        <Body className="twp:flex twp:h-full twp:bg-white twp:antialiased twp:dark:bg-zinc-900 twp:overflow-hidden">
          <div className="twp:w-full">{children}</div>
        </Body>
      </Html>
    </Theme>
  );
}
