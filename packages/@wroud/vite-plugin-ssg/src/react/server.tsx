import { Writable } from "stream";
import { renderToPipeableStream } from "react-dom/server";
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
  render: (htmlTags: HtmlTagDescriptor[], timeout?: number) => Promise<string>;
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
      let htmlContent = "";

      await new Promise<void>(async (resolve, reject) => {
        try {
          const writable = new Writable({
            write(chunk, encoding, callback) {
              htmlContent += chunk.toString();
              callback();
            },
            final(callback) {
              resolve();
              callback();
            },
          });

          const renderTags = renderViteTags.bind(undefined, htmlTags, context);

          const Index = indexOrApp.index;

          const { pipe, abort } = renderToPipeableStream(
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
              nonce: context.cspNonce,
              onAllReady() {
                clearTimeout(timeoutId);
                pipe(writable);
              },
              onError(error) {
                reject(error);
              },
            },
          );

          const timeoutId = setTimeout(() => {
            abort(new Error("SSG render timeout"));
          }, timeout);
        } catch (error) {
          reject(error);
        }
      });

      return htmlContent;
    },

    async getPathsToPrerender() {
      return await indexOrApp.getRoutesPrerender(appStartData);
    },

    async dispose() {
      await indexOrApp.stop();
    },
  };
}
