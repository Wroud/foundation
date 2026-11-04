/// <reference lib="dom" />
import {
  createFromReadableStream,
  setServerCallback,
} from "@vitejs/plugin-rsc/browser";
import { startTransition } from "react";
import { createRoot, hydrateRoot, type Root } from "react-dom/client";
import { rscStream } from "rsc-html-stream/client";
import { toAppInstance } from "../../app/AppInstance.js";
import { RscApp } from "../client.js";
import {
  createFromFetch,
  createTemporaryReferenceSet,
  encodeReply,
} from "@vitejs/plugin-rsc/browser";
import type { SsrEntryModule } from "./server-ssr.js";
import { createRscRenderRequest, type RscPayload } from "./shared.js";
import { createFlightNavigation } from "./flight-navigation.js";
import { trackClientModuleLoads } from "./client-module-loads.js";
import type { IAppContext } from "../../app.js";
import type { IndexComponentContext } from "../IndexComponent.js";

export type BrowserEntryLoader<T extends IAppContext = IAppContext> = () =>
  | SsrEntryModule<T>
  | undefined
  | Promise<SsrEntryModule<T> | undefined>;

function abandonHydration(failures: unknown[]): boolean {
  let unhandled: { failure: unknown } | undefined;
  for (const failure of failures) {
    const event = new Event("vite:preloadError", { cancelable: true });
    Object.assign(event, { payload: failure });
    if (window.dispatchEvent(event)) {
      unhandled ??= { failure };
    }
  }
  if (unhandled) {
    throw unhandled.failure;
  }
  return failures.length > 0;
}

export async function hydrate<T extends IAppContext>(
  entries: Record<string, BrowserEntryLoader<T>>,
): Promise<void> {
  const moduleLoads = trackClientModuleLoads();
  setServerCallback(callServer);
  const { navigate, prefetch } = createFlightNavigation({
    fetchFlight,
    update,
  });

  let root: Root | undefined;
  const failures: unknown[] = [];
  let initialPayload: RscPayload;
  let mount: string;
  let appStartData: T | { base: string };
  try {
    initialPayload = await createFromReadableStream<RscPayload>(rscStream);
    mount = initialPayload.mount;
    let module: SsrEntryModule<T> | undefined;
    try {
      module = await entries[mount]?.();
    } catch (failure) {
      failures.push(failure);
    }

    const context: IndexComponentContext = {
      href: window.location.href,
      base: initialPayload.context?.base ?? import.meta.env.BASE_URL,
      cspNonce: initialPayload.context?.cspNonce,
      navigate,
      prefetch,
    };
    appStartData = module
      ? await toAppInstance(module.default).start(context)
      : { base: context.base! };

    failures.push(...(await moduleLoads.settle()));
  } finally {
    moduleLoads.dispose();
  }
  if (abandonHydration(failures)) {
    return;
  }

  function render(payload: RscPayload) {
    return <RscApp appStartData={appStartData}>{payload.root}</RscApp>;
  }

  if ("__NO_HYDRATE" in globalThis) {
    root = createRoot(document);
    root.render(render(initialPayload));
  } else {
    root = hydrateRoot(document, render(initialPayload), {
      formState: initialPayload.formState,
    });
  }

  function update(payload: RscPayload, url?: URL) {
    const target = root;
    if (!target || payload.mount !== mount) {
      window.location.assign(url?.href ?? window.location.href);
      return;
    }
    startTransition(() => {
      target.render(render(payload));
    });
  }

  async function callServer(id: string, args: unknown[]): Promise<unknown> {
    const temporaryReferences = createTemporaryReferenceSet();
    const body = await encodeReply(args, { temporaryReferences });
    const payload = await createFromFetch<RscPayload>(
      fetch(createRscRenderRequest(location.href, { id, body })),
      { temporaryReferences },
    );
    update(payload);
    const returnValue = payload.returnValue;
    if (returnValue && !returnValue.ok) {
      throw returnValue.data;
    }
    return returnValue?.data;
  }

  function fetchFlight(url: URL): Promise<RscPayload> {
    return createFromFetch<RscPayload>(
      fetch(createRscRenderRequest(url.href)).then((response) => {
        const isFlight = response.headers
          .get("content-type")
          ?.startsWith("text/x-component");
        if (!response.ok && !isFlight) {
          throw new Error(
            `[vite-plugin-ssg] Failed to fetch RSC payload for "${url.pathname}": ${response.status} ${response.statusText}`,
          );
        }
        return response;
      }),
    );
  }

  if (import.meta.hot) {
    import.meta.hot.on("rsc:update", () => {
      navigate().catch(() => {
        window.location.reload();
      });
    });
  }
}
