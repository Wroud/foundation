/// <reference lib="dom" />
import { hydrateRoot } from "react-dom/client";
import type {
  IndexComponent,
  IndexComponentContext,
} from "./IndexComponent.js";
import type { HtmlTagDescriptor } from "vite";
import type { IAppContext } from "../app/IAppContext.js";
import { AppInstance } from "../app/AppInstance.js";
import { renderViteTags } from "./ssg-common.js";
import { AppContext } from "./components/AppContext.js";
import { SSGContext } from "./components/SSGContext.js";

export interface IClientAPI<T extends IAppContext> {
  appStartData: T;
  context: IndexComponentContext;
  hydrate: (htmlTags: HtmlTagDescriptor[]) => Promise<void>;
}

export async function create<T extends IAppContext>(
  indexOrApp: IndexComponent | AppInstance<T>,
  context: IndexComponentContext,
  mainScriptUrl?: string,
): Promise<IClientAPI<T>> {
  context = getContext(context);

  if (!(indexOrApp instanceof AppInstance)) {
    indexOrApp = new AppInstance(indexOrApp);
  }

  const appStartData = await indexOrApp.start(context);
  context.base = appStartData.base;

  return {
    appStartData,
    context,

    async hydrate(htmlTags: HtmlTagDescriptor[]) {
      const renderTags = renderViteTags.bind(undefined, htmlTags, context);
      const Index = indexOrApp.index;

      hydrateRoot(
        document,
        <AppContext value={appStartData}>
          <SSGContext value={{ context, renderTags, mainScriptUrl }}>
            <Index
              renderTags={renderTags}
              context={context}
              mainScriptUrl={mainScriptUrl}
            />
          </SSGContext>
        </AppContext>,
      );
    },
  };
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

  initialContext.href = window.location.href;

  return initialContext;
}
