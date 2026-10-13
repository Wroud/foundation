import {
  createFromReadableStream,
  getClientEntryUrl,
} from "@vitejs/plugin-rsc/ssr";
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
import { createMountTable } from "../../utils/mounts.js";
import { collectPrerenderRoutes } from "../../app/prerenderRoutes.js";
import { runWithDevFetch } from "./dev-fetch.js";
import type { RscPayload } from "./shared.js";
import type { IAppContext } from "../../app.js";
import type { IResponseMetadata } from "../../app/IResponseMetadata.js";

export interface SsrEntryModule<T extends IAppContext = IAppContext> {
  default: IndexComponent | AppInstance<T>;
}

export interface SsrRuntimeMount<T extends IAppContext = IAppContext> {
  path: string;
  load?: () => Promise<SsrEntryModule<T>>;
}

export interface SsrRuntimeOptions {
  base: string;
}

export interface RenderHtmlOptions {
  mount?: string;
  ssg?: boolean;
  nonce?: string;
  signal?: AbortSignal;
  formState?: ReactFormState;
  context?: IndexComponentContext;
  onError?: (error: unknown) => undefined;
}

export interface RenderHtmlResult {
  stream: ReadableStream<Uint8Array>;
  response?: IResponseMetadata;
}

export function createSsrRuntime<T extends IAppContext>(
  mounts: readonly SsrRuntimeMount<T>[],
  options: SsrRuntimeOptions,
) {
  const table = createMountTable(mounts, options.base || "/", (mount) =>
    mount.load
      ? mount.load().then((module) => toAppInstance(module.default))
      : Promise.resolve(undefined),
  );

  async function findMount(
    path: string,
  ): Promise<{ app: AppInstance<T> | undefined; base: string }> {
    const mount = table.find(path);
    if (!mount) {
      throw new Error(`[vite-plugin-ssg] unknown mount "${path}"`);
    }
    return { app: await table.load(mount), base: mount.base };
  }

  async function getStaticPaths(path = ""): Promise<string[]> {
    const { app, base } = await findMount(path);
    return app ? collectPrerenderRoutes(app, base) : ["/"];
  }

  async function renderHtml(
    rscStream: ReadableStream<Uint8Array>,
    renderOptions?: RenderHtmlOptions,
  ): Promise<RenderHtmlResult> {
    const { app, base } = await findMount(renderOptions?.mount ?? "");
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

      const response = await app?.getResponse(appStartData);

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

      const bootstrapScriptContent = `import(${JSON.stringify(getClientEntryUrl())})`;
      const signal = renderOptions?.signal;

      let htmlStream: ReadableStream<Uint8Array>;
      try {
        const rendered = await renderToReadableStream(root, {
          bootstrapScriptContent,
          nonce: renderOptions?.nonce,
          formState: renderOptions?.formState,
          progressiveChunkSize: renderOptions?.ssg ? Infinity : undefined,
          signal,
          onError: renderOptions?.onError,
        });
        if (renderOptions?.ssg) {
          await rendered.allReady;
        }
        htmlStream = rendered;
      } catch {
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
      } finally {
        if (renderOptions?.ssg) {
          await stopApp();
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

      return { stream, response };
    });
  }

  return { renderHtml, getStaticPaths };
}
