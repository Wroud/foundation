/// <reference lib="dom" />
import { hydrateRoot } from "react-dom/client";
import type {
  IndexComponent,
  IndexComponentContext,
} from "./IndexComponent.js";
import type { HtmlTagDescriptor } from "vite";
import { renderViteTags } from "./ssg-common.js";

export function hydrate(
  Index: IndexComponent,
  htmlTags: HtmlTagDescriptor[],
  context: IndexComponentContext,
  mainScriptUrl?: string,
) {
  hydrateRoot(
    document,
    <Index
      renderTags={renderViteTags.bind(undefined, htmlTags, getContext(context))}
      context={context}
      mainScriptUrl={mainScriptUrl}
    />,
  );
}

function getContext(
  initialContext: IndexComponentContext,
): IndexComponentContext {
  initialContext.base =
    document.querySelector("meta[property='base']")?.getAttribute("content") ||
    undefined;
  initialContext.cspNonce =
    document
      .querySelector("meta[property='csp-nonce']")
      ?.getAttribute("nonce") || undefined;

  return initialContext;
}
