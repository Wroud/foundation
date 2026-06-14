/// <reference lib="dom" />
import {
  createFromReadableStream,
  setServerCallback,
} from "@vitejs/plugin-rsc/browser";
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
import type { IAppContext } from "../../app.js";
import type { IndexComponentContext } from "../IndexComponent.js";

export async function hydrate<T extends IAppContext>(
  module?: SsrEntryModule<T>,
): Promise<void> {
  const initialPayload = await createFromReadableStream<RscPayload>(rscStream);

  setServerCallback(callServer);

  const context: IndexComponentContext = {
    href: window.location.href,
    base: initialPayload.context?.base ?? import.meta.env.BASE_URL,
    cspNonce: initialPayload.context?.cspNonce,
    navigate,
  };
  const appStartData = module
    ? await toAppInstance(module.default).start(context)
    : { base: context.base! };

  function render(payload: RscPayload) {
    return <RscApp appStartData={appStartData}>{payload.root}</RscApp>;
  }

  let root: Root;
  if ("__NO_HYDRATE" in globalThis) {
    root = createRoot(document);
    root.render(render(initialPayload));
  } else {
    root = hydrateRoot(document, render(initialPayload), {
      formState: initialPayload.formState,
    });
  }

  function update(payload: RscPayload) {
    root.render(render(payload));
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

  let requestIndex = 0;
  async function navigate(href = location.href) {
    const url = new URL(href, location.href);
    const request = ++requestIndex;
    const next = await createFromFetch<RscPayload>(
      fetch(createRscRenderRequest(url.href)).then((response) => {
        if (!response.ok) {
          throw new Error(
            `[vite-plugin-ssg] Failed to fetch RSC payload for "${url.pathname}": ${response.status} ${response.statusText}`,
          );
        }
        return response;
      }),
    );
    if (requestIndex !== request) {
      return;
    }
    update(next);
  }

  if (import.meta.hot) {
    import.meta.hot.on("rsc:update", () => {
      navigate().catch(() => {
        window.location.reload();
      });
    });
  }
}
