import {
  renderToReadableStream,
  type ReactDOMServerReadableStream,
} from "react-dom/server";
import type { HtmlTagDescriptor } from "vite";
import type {
  IndexComponent,
  IndexComponentContext,
} from "./IndexComponent.js";
import type { IAppContext } from "../app/IAppContext.js";
import { AppInstance } from "../app/AppInstance.js";
import { renderViteTags } from "./ssg-common.js";
import { AppContext } from "./components/AppContext.js";
import { SSGContext } from "./components/SSGContext.js";

export type BoundServerApiFunction<T extends IAppContext = IAppContext> = (
  context: IndexComponentContext,
) => Promise<IServerAPI<T>>;

export interface IServerAPI<T extends IAppContext> {
  appStartData: T;
  context: IndexComponentContext;
  render: (
    htmlTags: HtmlTagDescriptor[],
    timeout?: number,
  ) => Promise<ReactDOMServerReadableStream>;
  getPathsToPrerender: () => Promise<string[]>;
  dispose: () => Promise<void>;
}

export async function create<T extends IAppContext>(
  indexOrApp: IndexComponent | AppInstance<T>,
  context: IndexComponentContext,
  mainScriptUrl?: string,
): Promise<IServerAPI<T>> {
  if (!(indexOrApp instanceof AppInstance)) {
    indexOrApp = new AppInstance(indexOrApp);
  }

  const appStartData = await indexOrApp.start(context);
  context.base = appStartData.base;

  return {
    appStartData,
    context,

    async render(htmlTags, timeout = 10000) {
      const renderTags = renderViteTags.bind(undefined, htmlTags, context);

      const Index = indexOrApp.index;

      const controller = new AbortController();
      setTimeout(() => {
        controller.abort(new Error("SSG render timeout"));
      }, timeout);

      return renderToReadableStream(
        <AppContext value={appStartData}>
          <SSGContext value={{ context, renderTags, mainScriptUrl }}>
            <Index
              renderTags={renderTags}
              context={context}
              mainScriptUrl={mainScriptUrl}
            />
          </SSGContext>
        </AppContext>,
        {
          signal: controller.signal,
          nonce: context.cspNonce,
        },
      );
    },

    async getPathsToPrerender() {
      return await indexOrApp.getRoutesPrerender(appStartData);
    },

    async dispose() {
      await indexOrApp.stop();
    },
  };
}
