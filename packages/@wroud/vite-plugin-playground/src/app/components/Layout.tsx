import type { IndexComponentProps } from "@wroud/vite-plugin-ssg";
import {
  Html,
  Body,
  Head,
  Link,
} from "@wroud/vite-plugin-ssg/react/components";
import { Theme } from "./Theme.js";
import { useTheme } from "../useTheme.js";
import { useNavigation } from "@wroud/playground-react/views";
import { PlaygroundRoutes } from "@wroud/playground";

interface Props extends IndexComponentProps {
  children?: React.ReactNode;
}

export function Layout({ children }: Props) {
  const theme = useTheme();
  const navigation = useNavigation();
  const iconUrl =
    navigation.router.matcher?.stateToUrl({
      id: PlaygroundRoutes.assets,
      params: {},
    }) + "logo.svg";
  const stylesUrl =
    navigation.router.matcher?.stateToUrl({
      id: PlaygroundRoutes.assets,
      params: {},
    }) + "Layout.css";

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
          {iconUrl && <Link rel="icon" type="image/svg+xml" href={iconUrl} />}
          {stylesUrl && <Link rel="stylesheet" href={stylesUrl} />}
        </Head>
        <Body className="twp:flex twp:h-full twp:bg-white twp:antialiased twp:dark:bg-zinc-900 twp:overflow-hidden">
          <div className="twp:w-full">{children}</div>
        </Body>
      </Html>
    </Theme>
  );
}
