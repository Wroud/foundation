import { Writable } from "stream";
import { renderToPipeableStream } from "react-dom/server";
import type { HtmlTagDescriptor } from "vite";
import type {
  IndexComponent,
  IndexComponentContext,
} from "./IndexComponent.js";
import { renderViteTags } from "@wroud/vite-plugin-ssg/react/ssg-common";
import { SSGContext } from "@wroud/vite-plugin-ssg/react/components/SSGContext";
import type { IAppStartData } from "../app.js";
import { AppStartDataContext } from "@wroud/vite-plugin-ssg/react/components/AppStartDataContext";
import { AppInstance } from "@wroud/vite-plugin-ssg/app/AppInstance";

export type BoundServerApiFunction = (
  context: IndexComponentContext,
) => Promise<IServerAPI>;

export interface IServerAPI {
  appStartData: IAppStartData;
  context: IndexComponentContext;
  render: (htmlTags: HtmlTagDescriptor[], timeout?: number) => Promise<string>;
  getPathsToPrerender: () => Promise<string[]>;
  dispose: () => Promise<void>;
}

export async function create(
  indexOrApp: IndexComponent | AppInstance,
  context: IndexComponentContext,
  mainScriptUrl?: string,
): Promise<IServerAPI> {
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
            <AppStartDataContext value={appStartData}>
              <SSGContext value={{ context, renderTags, mainScriptUrl }}>
                <Index
                  renderTags={renderTags}
                  context={context}
                  mainScriptUrl={mainScriptUrl}
                />
              </SSGContext>
            </AppStartDataContext>,
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
      const routes = await indexOrApp.getRoutesPrerender(appStartData);

      return routes
        .map((state) =>
          appStartData.navigation.router.matcher?.stateToUrl(state),
        )
        .filter((url) => url !== null) as string[];
    },

    async dispose() {
      await indexOrApp.stop();
    },
  };
}
