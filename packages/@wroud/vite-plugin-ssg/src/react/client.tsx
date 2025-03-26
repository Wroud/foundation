/// <reference lib="dom" />
import { hydrateRoot } from "react-dom/client";
import type {
  IndexComponent,
  IndexComponentContext,
} from "./IndexComponent.js";
import type { HtmlTagDescriptor } from "vite";
import { renderViteTags } from "./ssg-common.js";
import { SSGContext } from "./components/SSGContext.js";
import { type IAppStartData } from "../app/IAppStartData.js";
import { AppStartDataContext } from "./components/AppStartDataContext.js";
import { AppInstance } from "../app/AppInstance.js";

export interface IClientAPI {
  appStartData: IAppStartData;
  context: IndexComponentContext;
  hydrate: (htmlTags: HtmlTagDescriptor[]) => Promise<void>;
}

export async function create(
  indexOrApp: IndexComponent | AppInstance,
  context: IndexComponentContext,
  mainScriptUrl?: string,
): Promise<IClientAPI> {
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
        <AppStartDataContext value={appStartData}>
          <SSGContext value={{ context, renderTags, mainScriptUrl }}>
            <Index
              renderTags={renderTags}
              context={context}
              mainScriptUrl={mainScriptUrl}
            />
          </SSGContext>
        </AppStartDataContext>,
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
