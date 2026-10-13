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
import {
  toRscInstance,
  type RscInstance,
  type RequestHandler,
} from "../../app/RscConfig.js";
import { RenderContextProvider } from "../components/RenderContext.js";
import { runWithRenderContext } from "../components/renderContextAccessor.react-server.js";
import type { IResponseMetadata } from "../../app/IResponseMetadata.js";
import type {
  IndexComponent,
  IndexComponentContext,
  RscEntryComponent,
} from "../IndexComponent.js";
import {
  createMountTable,
  mountRoute,
  type Mount as MountEntry,
} from "../../utils/mounts.js";
import { collectPrerenderRoutes } from "../../app/prerenderRoutes.js";
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
import {
  RenderErrorTracker,
  readShell,
  resolveResponse,
} from "./render-outcome.js";
import type { IAppContext } from "../../app.js";

export interface SsgMountModules<T extends IAppContext = IAppContext> {
  Index?: IndexComponent;
  rsc?: RscEntryComponent | RscInstance<T>;
  css?: React.ReactNode;
}

export interface SsgRuntimeMount<T extends IAppContext = IAppContext> {
  path: string;
  load: () => Promise<SsgMountModules<T>>;
}

export interface SsgRuntimeOptions {
  base: string;
  cspNonce?: string;
}

export interface SsgRequestOptions {
  cspNonce?: string;
  settled?: boolean;
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
    status?: number;
    headers: Headers;
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

interface LoadedMount<T extends IAppContext> {
  Index: IndexComponent | undefined;
  rscApp: RscInstance<T>;
  css: React.ReactNode;
}

type Mount<T extends IAppContext> = MountEntry<SsgRuntimeMount<T>>;

export function createSsgRuntime<T extends IAppContext>(
  mounts: readonly SsgRuntimeMount<T>[],
  options: SsgRuntimeOptions,
): SsgRuntime {
  const table = createMountTable<SsgRuntimeMount<T>, LoadedMount<T>>(
    mounts,
    options.base || "/",
    (mount) =>
      mount.load().then((modules) => ({
        Index: modules.Index,
        rscApp: toRscInstance(modules.rsc ?? passThroughRoot),
        css: modules.css,
      })),
  );

  function createContext(
    mount: Mount<T>,
    url: URL,
    request: Request,
    requestOptions?: SsgRequestOptions,
  ): IndexComponentContext {
    return {
      href: url.href,
      base: mount.base,
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
    mount: Mount<T>,
    context: IndexComponentContext,
    signal: AbortSignal,
    tracker: RenderErrorTracker,
    action?: ActionOutcome,
  ): Promise<{
    stream: ReadableStream<Uint8Array>;
    response: IResponseMetadata | undefined;
  }> {
    const { rscApp, Index, css } = await table.load(mount);
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
      const response = await rscApp.getResponse(app);
      const RscRoot = rscApp.root;
      const clientContext = toClientContext({
        ...context,
        base: app.base ?? context.base,
      });
      const renderContext = {
        base: clientContext.base ?? "/",
        cspNonce: clientContext.cspNonce,
      };
      const root = (
        <RenderContextProvider value={renderContext}>
          {css}
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
      const payload: RscPayload = {
        root,
        context: clientContext,
        mount: mount.path,
      };
      if (action?.returnValue) {
        payload.returnValue = action.returnValue;
      }
      if (action?.formState) {
        payload.formState = action.formState;
      }
      const stream = runWithRenderContext(renderContext, () =>
        renderToReadableStream<RscPayload>(payload, {
          signal,
          temporaryReferences: action?.temporaryReferences,
          onError: tracker.onError,
        }),
      );
      const stopTransformer: Transformer<Uint8Array, Uint8Array> = {
        flush: stopApp,
        cancel: stopApp,
      };
      return {
        stream: stream.pipeThrough(
          new TransformStream<Uint8Array, Uint8Array>(stopTransformer),
        ),
        response,
      };
    } catch (error) {
      await stopApp();
      throw error;
    }
  }

  async function loadSsr() {
    return import.meta.viteRsc.loadModule<SsrModule>("ssr", "index");
  }

  function renderHtmlOptions(
    mount: Mount<T>,
    context: IndexComponentContext,
    signal: AbortSignal,
    tracker: RenderErrorTracker,
    ssg?: boolean,
    formState?: ReactFormState,
  ) {
    return {
      mount: mount.path,
      ssg,
      nonce: context.cspNonce,
      signal,
      formState,
      onError: tracker.onError,
      context: {
        href: context.href,
        base: context.base,
        cspNonce: context.cspNonce,
        headers: context.headers,
      },
    };
  }

  async function handleRequest(
    mount: Mount<T>,
    request: Request,
    requestOptions?: SsgRequestOptions,
  ): Promise<Response> {
    const { isRsc, isAction, actionId, url } = parseRenderRequest(request);
    const context = createContext(mount, url, request, requestOptions);
    return runWithDevFetch(context, async () => {
      let action: ActionOutcome | undefined;
      if (isAction) {
        action = await handleServerAction(request, actionId);
        if (action.errorResponse) {
          return action.errorResponse;
        }
      }

      const tracker = new RenderErrorTracker(request.signal);
      const { stream: rscStream, response: rscResponse } = await renderFlight(
        mount,
        context,
        request.signal,
        tracker,
        action,
      );

      if (isRsc) {
        const body = requestOptions?.settled
          ? await new Response(rscStream).arrayBuffer()
          : await readShell(rscStream);
        const { status, headers } = resolveResponse(tracker, rscResponse);
        headers.set("content-type", RSC_CONTENT_TYPE);
        headers.append(HEADER_VARY, HEADER_RSC);
        return new Response(body, {
          status: action?.status ?? status,
          headers,
        });
      }

      const ssr = await loadSsr();
      const result = await ssr.renderHtml(
        rscStream,
        renderHtmlOptions(
          mount,
          context,
          request.signal,
          tracker,
          requestOptions?.settled,
          action?.formState,
        ),
      );
      const { status, headers } = resolveResponse(
        tracker,
        rscResponse,
        result.response,
      );
      headers.set("content-type", "text/html;charset=utf-8");
      return new Response(result.stream, { status, headers });
    });
  }

  async function handler(
    request: Request,
    requestOptions?: SsgRequestOptions,
  ): Promise<Response> {
    const mount = table.match(new URL(request.url).pathname);
    if (!mount) {
      return new Response("Not Found", { status: 404 });
    }
    const { rscApp } = await table.load(mount);
    const next = rscApp.middleware.reduceRight<RequestHandler>(
      (next, middleware) => middleware(next),
      (request) => handleRequest(mount, request, requestOptions),
    );
    return next(request);
  }

  async function handleSsg(request: Request) {
    const url = new URL(request.url);
    const mount = table.match(url.pathname);
    if (!mount) {
      throw new Error(
        `[vite-plugin-ssg] no mount serves ${url.pathname}; add a root entry or declare the route under a mount`,
      );
    }
    const context = createContext(mount, url, request);
    return runWithDevFetch(context, async () => {
      const tracker = new RenderErrorTracker(request.signal);
      const { stream, response: rscResponse } = await renderFlight(
        mount,
        context,
        request.signal,
        tracker,
      );
      const [rscStream1, rscStream2] = stream.tee();

      const ssr = await loadSsr();
      const result = await ssr.renderHtml(
        rscStream1,
        renderHtmlOptions(mount, context, request.signal, tracker, true),
      );
      const { status, headers } = resolveResponse(
        tracker,
        rscResponse,
        result.response,
      );
      return { html: result.stream, rsc: rscStream2, status, headers };
    });
  }

  async function mountStaticPaths(mount: Mount<T>): Promise<string[]> {
    const { rscApp } = await table.load(mount);
    if (rscApp.hasRoutesPrerender) {
      return collectPrerenderRoutes(rscApp, mount.base);
    }
    const ssr = await loadSsr();
    return ssr.getStaticPaths(mount.path);
  }

  async function getStaticPaths(): Promise<string[]> {
    const lists = await Promise.all(table.mounts.map(mountStaticPaths));
    const routes = new Set<string>();
    table.mounts.forEach((mount, i) => {
      for (const route of lists[i]!) {
        routes.add(mountRoute(mount.path, route));
      }
    });
    return [...routes];
  }

  async function dispose(): Promise<void> {}

  return { handler, getStaticPaths, handleSsg, dispose };
}
