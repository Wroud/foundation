import {
  renderToReadableStream,
  loadServerAction,
  decodeReply,
  decodeAction,
  decodeFormState,
  createTemporaryReferenceSet,
} from "@vitejs/plugin-rsc/rsc";
import type { Transformer } from "node:stream/web";
import type { ReactFormState } from "react-dom/client";
import { toRscInstance, type RscInstance } from "../../app/RscConfig.js";
import { RenderContextProvider } from "../components/RenderContext.js";
import type {
  IndexComponent,
  IndexComponentContext,
  RscEntryComponent,
} from "../IndexComponent.js";
import { normalizeRoute } from "../../utils/routes.js";
import { runWithDevFetch } from "./dev-fetch.js";
import {
  type ActionReturnValue,
  type RscPayload,
  parseRenderRequest,
  RSC_CONTENT_TYPE,
  HEADER_RSC,
  HEADER_VARY,
} from "./shared.js";
import type { createSsrRuntime } from "./server-ssr.js";
import type { IAppContext } from "../../app.js";

export interface SsgRuntimeModules<T extends IAppContext = IAppContext> {
  Index?: IndexComponent;
  rsc?: RscEntryComponent | RscInstance<T>;
}

export interface SsgRuntimeOptions {
  base: string;
  cspNonce?: string;
  css?: React.ReactNode;
}

export interface SsgRequestOptions {
  cspNonce?: string;
}

export interface SsgRuntime {
  handler: (
    request: Request,
    requestOptions?: SsgRequestOptions,
  ) => Promise<Response>;
  getStaticPaths: () => Promise<string[]>;
  handleSsg: (request: Request) => Promise<{
    html: ReadableStream<Uint8Array>;
    rsc: ReadableStream<Uint8Array>;
  }>;
  dispose: () => Promise<void>;
}

type SsrModule = ReturnType<typeof createSsrRuntime>;

const passThroughRoot: RscEntryComponent = ({ children }) => children;

interface ActionOutcome {
  returnValue?: ActionReturnValue;
  formState?: ReactFormState;
  temporaryReferences?: ReturnType<typeof createTemporaryReferenceSet>;
  status?: number;
  errorResponse?: Response;
}

async function handleServerAction(
  request: Request,
  actionId: string | undefined,
): Promise<ActionOutcome> {
  if (actionId) {
    const contentType = request.headers.get("content-type");
    const body = contentType?.startsWith("multipart/form-data")
      ? await request.formData()
      : await request.text();
    const temporaryReferences = createTemporaryReferenceSet();
    const args = await decodeReply(body, { temporaryReferences });
    const action = await loadServerAction(actionId);
    try {
      const data = await action.apply(null, args);
      return { returnValue: { ok: true, data }, temporaryReferences };
    } catch (error) {
      return {
        returnValue: { ok: false, data: error },
        temporaryReferences,
        status: 500,
      };
    }
  }

  const formData = await request.formData();
  const decodedAction = await decodeAction(formData);
  try {
    const result = await decodedAction();
    return { formState: await decodeFormState(result, formData) };
  } catch {
    return {
      errorResponse: new Response(
        "Internal Server Error: server action failed",
        { status: 500 },
      ),
    };
  }
}

export function createSsgRuntime<T extends IAppContext>(
  modules: SsgRuntimeModules<T>,
  options: SsgRuntimeOptions,
): SsgRuntime {
  const base = options.base || "/";
  const { Index } = modules;
  const rscApp = toRscInstance(modules.rsc ?? passThroughRoot);

  function createContext(
    url: URL,
    request: Request,
    requestOptions?: SsgRequestOptions,
  ): IndexComponentContext {
    return {
      href: url.href,
      base,
      cspNonce: requestOptions?.cspNonce ?? options.cspNonce,
      headers: Object.fromEntries(request.headers),
    };
  }

  function toClientContext(
    context: IndexComponentContext,
  ): IndexComponentContext {
    return {
      href: context.href,
      base: context.base,
      cspNonce: context.cspNonce,
    };
  }

  async function renderFlight(
    context: IndexComponentContext,
    signal: AbortSignal,
    action?: ActionOutcome,
  ): Promise<ReadableStream<Uint8Array>> {
    const app = await rscApp.start(context);

    let stopped = false;
    async function stopApp() {
      if (stopped) {
        return;
      }
      stopped = true;
      await rscApp.stop(app);
    }

    try {
      const RscRoot = rscApp.root;
      const clientContext = toClientContext({
        ...context,
        base: app.base ?? context.base,
      });
      const root = (
        <RenderContextProvider
          value={{
            base: clientContext.base ?? "/",
            cspNonce: clientContext.cspNonce,
          }}
        >
          {options.css}
          {clientContext.cspNonce && (
            <meta
              {...{ property: "csp-nonce" }}
              nonce={clientContext.cspNonce}
            />
          )}
          <RscRoot context={context} app={app}>
            {Index && <Index context={clientContext} />}
          </RscRoot>
        </RenderContextProvider>
      );
      const payload: RscPayload = { root, context: clientContext };
      if (action?.returnValue) {
        payload.returnValue = action.returnValue;
      }
      if (action?.formState) {
        payload.formState = action.formState;
      }
      const stream = renderToReadableStream<RscPayload>(payload, {
        signal,
        temporaryReferences: action?.temporaryReferences,
      });
      const stopTransformer: Transformer<Uint8Array, Uint8Array> = {
        flush: stopApp,
        cancel: stopApp,
      };
      return stream.pipeThrough(
        new TransformStream<Uint8Array, Uint8Array>(stopTransformer),
      );
    } catch (error) {
      await stopApp();
      throw error;
    }
  }

  async function loadSsr() {
    return import.meta.viteRsc.loadModule<SsrModule>("ssr", "index");
  }

  function renderHtmlOptions(
    context: IndexComponentContext,
    signal: AbortSignal,
    ssg?: boolean,
    formState?: ReactFormState,
  ) {
    return {
      ssg,
      nonce: context.cspNonce,
      signal,
      formState,
      context: {
        href: context.href,
        base: context.base,
        cspNonce: context.cspNonce,
        headers: context.headers,
      },
    };
  }

  async function handler(
    request: Request,
    requestOptions?: SsgRequestOptions,
  ): Promise<Response> {
    const { isRsc, isAction, actionId, url } = parseRenderRequest(request);
    const context = createContext(url, request, requestOptions);
    return runWithDevFetch(context, async () => {
      let action: ActionOutcome | undefined;
      if (isAction) {
        action = await handleServerAction(request, actionId);
        if (action.errorResponse) {
          return action.errorResponse;
        }
      }

      const rscStream = await renderFlight(context, request.signal, action);

      if (isRsc) {
        return new Response(rscStream, {
          status: action?.status,
          headers: {
            "content-type": RSC_CONTENT_TYPE,
            [HEADER_VARY]: HEADER_RSC,
          },
        });
      }

      const ssr = await loadSsr();
      const result = await ssr.renderHtml(
        rscStream,
        renderHtmlOptions(context, request.signal, false, action?.formState),
      );
      return new Response(result.stream, {
        status: result.status,
        headers: { "content-type": "text/html;charset=utf-8" },
      });
    });
  }

  async function handleSsg(request: Request) {
    const url = new URL(request.url);
    const context = createContext(url, request);
    return runWithDevFetch(context, async () => {
      const rscStream = await renderFlight(context, request.signal);
      const [rscStream1, rscStream2] = rscStream.tee();

      const ssr = await loadSsr();
      const result = await ssr.renderHtml(
        rscStream1,
        renderHtmlOptions(context, request.signal, true),
      );
      return { html: result.stream, rsc: rscStream2 };
    });
  }

  async function getStaticPaths(): Promise<string[]> {
    if (rscApp.hasRoutesPrerender) {
      const href = new URL(base, "http://ssg.local/");
      const context = createContext(href, new Request(href));
      const app = await rscApp.start(context);
      try {
        const declared = await rscApp.getRoutesPrerender(app);
        const routes = [...new Set(declared.map(normalizeRoute))];
        return routes.length ? routes : ["/"];
      } finally {
        await rscApp.stop(app);
      }
    }

    const ssr = await loadSsr();
    return ssr.getStaticPaths();
  }

  async function dispose(): Promise<void> {}

  return { handler, getStaticPaths, handleSsg, dispose };
}
