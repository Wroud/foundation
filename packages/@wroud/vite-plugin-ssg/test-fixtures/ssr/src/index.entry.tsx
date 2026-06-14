import { useState } from "react";
import type { IndexComponentProps } from "@wroud/vite-plugin-ssg";
import {
  Html,
  Head,
  Body,
  Link,
  Script,
} from "@wroud/vite-plugin-ssg/react/components";
import { createAppConfig } from "@wroud/vite-plugin-ssg/app";
import { useRequest } from "./server-context.js";
import { addAction } from "./actions.js";
import { AddButton } from "./add-button.js";

function Index({ context }: IndexComponentProps) {
  const { greeting, path, total } = useRequest();
  const [count, setCount] = useState(0);
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <title>{`SSR ${path}`}</title>
        <Link rel="icon" href="/favicon.svg" data-testid="nonced-link" />
        <Script data-testid="inline-script">{"window.__SSR_INLINE = 1;"}</Script>
      </Head>
      <Body>
        <h1 data-testid="ssr">SSR</h1>
        <p data-testid="greeting">{greeting}</p>
        <p data-testid="path">{path}</p>
        <p data-testid="nonce">{context.cspNonce}</p>
        <p data-testid="total">{total}</p>
        <form action={addAction} data-testid="add-form">
          <input type="hidden" name="amount" value="7" />
          <button type="submit" data-testid="add-submit">
            add
          </button>
        </form>
        <button data-testid="counter" onClick={() => setCount((c) => c + 1)}>
          count is {count}
        </button>
        <AddButton />
      </Body>
    </Html>
  );
}

export default createAppConfig(Index);
