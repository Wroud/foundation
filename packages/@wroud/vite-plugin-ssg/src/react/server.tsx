import { Writable } from "stream";
import type { ServerResponse } from "http";
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
  stream: (
    response: ServerResponse,
    htmlTags: HtmlTagDescriptor[],
    timeout?: number,
  ) => Promise<void>;
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

    async stream(response, htmlTags, timeout = 10000) {
      // Streaming SSR — flushes the shell as soon as it's ready and pipes
      // suspended content as it resolves. Caveats vs. the buffered `render`:
      //   - Errors inside <Suspense> after the shell flushes cannot change
      //     the status code; React calls onError + onAllReady but `pipe()`
      //     has already sent 200. Caller must handle this (see middleware).
      //   - `didError` follows React's documented onShellReady pattern:
      //     suspense-boundary errors before the shell is ready surface there
      //     as 500. Don't simplify it away.
      //   - Timeout uses `abort()`, which causes React to emit fallback
      //     content for unfinished boundaries and then fire onAllReady, so
      //     the promise still settles. Do not also reject from the timer.
      return new Promise<void>((resolve, reject) => {
        const renderTags = renderViteTags.bind(undefined, htmlTags, context);

        const Index = indexOrApp.index;

        let didError = false;
        let caughtError: unknown = null;

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
            onShellReady() {
              response.statusCode = didError ? 500 : 200;
              response.setHeader("content-type", "text/html");
              pipe(response);
            },
            onShellError(error) {
              clearTimeout(timeoutId);
              if (!response.headersSent) {
                response.statusCode = 500;
                response.setHeader("content-type", "text/html");
                response.end("<h1>Something went wrong</h1>");
              }
              reject(error);
            },
            onAllReady() {
              clearTimeout(timeoutId);
              if (didError) {
                reject(caughtError);
              } else {
                resolve();
              }
            },
            onError(error) {
              didError = true;
              caughtError = error;
              console.error(error);
            },
          },
        );

        const timeoutId = setTimeout(() => {
          abort(new Error("SSG stream timeout"));
        }, timeout);
      });
    },

    async getPathsToPrerender() {
      return await indexOrApp.getRoutesPrerender(appStartData);
    },

    async dispose() {
      await indexOrApp.stop();
    },
  };
}
