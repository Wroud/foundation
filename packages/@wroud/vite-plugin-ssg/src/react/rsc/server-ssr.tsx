import { createFromReadableStream } from "@vitejs/plugin-rsc/ssr";
import type { Transformer } from "node:stream/web";
import type { ReactFormState } from "react-dom/client";
import { use } from "react";
import { renderToReadableStream } from "react-dom/server.edge";
import { injectRSCPayload } from "rsc-html-stream/server";
import { toAppInstance, type AppInstance } from "../../app/AppInstance.js";
import { AppContext } from "../components/AppContext.js";
import type {
  IndexComponent,
  IndexComponentContext,
} from "../IndexComponent.js";
import { normalizeRoute } from "../../utils/routes.js";
import { runWithDevFetch } from "./dev-fetch.js";
import type { RscPayload } from "./shared.js";
import type { IAppContext } from "../../app.js";

export interface SsrEntryModule<T extends IAppContext = IAppContext> {
  default: IndexComponent | AppInstance<T>;
}

export interface SsrRuntimeOptions {
  base: string;
}

export interface RenderHtmlOptions {
  ssg?: boolean;
  nonce?: string;
  signal?: AbortSignal;
  formState?: ReactFormState;
  context?: IndexComponentContext;
}

export interface RenderHtmlResult {
  stream: ReadableStream<Uint8Array>;
  status?: number;
}

export function createSsrRuntime<T extends IAppContext>(
  module: SsrEntryModule<T> | undefined,
  options: SsrRuntimeOptions,
) {
  const base = options.base || "/";
  const app = module ? toAppInstance(module.default) : undefined;

  async function getStaticPaths(): Promise<string[]> {
    if (!app) {
      return ["/"];
    }
    const context: IndexComponentContext = {
      href: new URL(base, "http://ssg.local/").href,
      base,
    };
    const startData = await app.start(context);
    try {
      const declared = await app.getRoutesPrerender(startData);
      const routes = [...new Set(declared.map(normalizeRoute))];
      return routes.length ? routes : ["/"];
    } finally {
      await app.stop(startData);
    }
  }

  async function renderHtml(
    rscStream: ReadableStream<Uint8Array>,
    renderOptions?: RenderHtmlOptions,
  ): Promise<RenderHtmlResult> {
    const context: IndexComponentContext = {
      base,
      ...renderOptions?.context,
    };
    return runWithDevFetch(context, async () => {
      const [rscStream1, rscStream2] = rscStream.tee();

      const appStartData =
        (await app?.start(context)) ??
        ({
          base: context.base ?? "/",
        } as T);

      let stopped = false;
      async function stopApp() {
        if (stopped) {
          return;
        }
        stopped = true;
        await app?.stop(appStartData);
      }

      let payload: Promise<RscPayload> | undefined;
      function SsrRoot() {
        payload ??= createFromReadableStream<RscPayload>(rscStream1);
        return use(payload).root;
      }

      const root = (
        <AppContext value={appStartData}>
          <SsrRoot />
        </AppContext>
      );

      const bootstrapScriptContent =
        await import.meta.viteRsc.loadBootstrapScriptContent("index");
      const signal = renderOptions?.signal;

      let htmlStream: ReadableStream<Uint8Array>;
      let status: number | undefined;

      if (renderOptions?.ssg) {
        try {
          const ssgStream = await renderToReadableStream(root, {
            bootstrapScriptContent,
            nonce: renderOptions?.nonce,
            progressiveChunkSize: Infinity,
            signal,
          });
          await ssgStream.allReady;
          htmlStream = ssgStream;
        } finally {
          await stopApp();
        }
      } else {
        try {
          htmlStream = await renderToReadableStream(root, {
            bootstrapScriptContent,
            nonce: renderOptions?.nonce,
            formState: renderOptions?.formState,
            signal,
          });
        } catch {
          status = 500;
          htmlStream = await renderToReadableStream(
            <html>
              <body>
                <noscript>Internal Server Error: SSR failed</noscript>
              </body>
            </html>,
            {
              bootstrapScriptContent:
                `self.__NO_HYDRATE=1;` + bootstrapScriptContent,
              nonce: renderOptions?.nonce,
            },
          );
        }
      }

      let stream = htmlStream.pipeThrough(
        injectRSCPayload(rscStream2, { nonce: renderOptions?.nonce }),
      );

      if (!renderOptions?.ssg) {
        const stopTransformer: Transformer<Uint8Array, Uint8Array> = {
          flush: stopApp,
          cancel: stopApp,
        };
        stream = stream.pipeThrough(
          new TransformStream<Uint8Array, Uint8Array>(stopTransformer),
        );
      }

      return { stream, status };
    });
  }

  return { renderHtml, getStaticPaths };
}
