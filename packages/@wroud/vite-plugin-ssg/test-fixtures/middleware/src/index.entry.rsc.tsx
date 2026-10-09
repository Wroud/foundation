import { AsyncLocalStorage } from "node:async_hooks";
import { Suspense } from "react";
import { createRscConfig } from "@wroud/vite-plugin-ssg/app";
import type { RequestMiddleware, RscEntryProps } from "@wroud/vite-plugin-ssg";

const storage = new AsyncLocalStorage<string>();
const gates = new Map<
  string,
  { promise: Promise<void>; resolve: () => void }
>();
let starts = 0;
let stops = 0;

const outer: RequestMiddleware = (next) => async (request) => {
  if (request.headers.get("x-block") === "1") {
    return new Response("blocked", { status: 401 });
  }
  const url = new URL(request.url);
  if (url.pathname === "/release") {
    gates.get(url.searchParams.get("id") ?? "")?.resolve();
    return new Response("released");
  }
  if (url.pathname === "/counts") {
    return Response.json({ starts, stops });
  }
  const headers = new Headers(request.headers);
  headers.set("x-enter", "outer");
  if (url.pathname === "/rewrite") {
    url.pathname = url.searchParams.get("target") ?? "/replaced";
    headers.set("x-id", "replacement");
  }
  const replacement = new Request(url, {
    method: request.method,
    headers,
    body: request.body,
    signal: request.signal,
    ...(request.body ? { duplex: "half" } : {}),
  });
  try {
    const response = await next(replacement);
    response.headers.append("x-exit", "outer");
    return response;
  } catch (error) {
    return new Response(String(error), { status: 503 });
  }
};

const inner: RequestMiddleware = (next) => async (request) => {
  const headers = new Headers(request.headers);
  headers.append("x-enter", "inner");
  const response = await next(new Request(request, { headers }));
  response.headers.append("x-exit", "inner");
  if (new URL(request.url).pathname === "/decorate") {
    return new Response(response.body, {
      status: 202,
      headers: response.headers,
    });
  }
  return response;
};

const contextMiddleware: RequestMiddleware = (next) => (request) =>
  storage.run(request.headers.get("x-id") ?? "anonymous", () => next(request));

async function SlowSection({ id }: { id: string }) {
  await gates.get(id)!.promise;
  gates.delete(id);
  return <p data-testid="slow">{storage.getStore()}</p>;
}

async function RscRoot({ context, children }: RscEntryProps) {
  const id = storage.getStore();
  await new Promise((resolve) => setTimeout(resolve, id === "first" ? 20 : 1));
  const path = new URL(context.href!).pathname;
  return (
    <html>
      <body>
        <p data-testid="path">{path}</p>
        <p data-testid="context">{storage.getStore()}</p>
        {children}
        {path === "/slow" && (
          <Suspense fallback={<p data-testid="fallback">waiting</p>}>
            <SlowSection id={id!} />
          </Suspense>
        )}
      </body>
    </html>
  );
}

export default createRscConfig(RscRoot, {
  middleware: [outer, inner, contextMiddleware],
  onAppStart: async (context) => {
    starts++;
    if (new URL(context.href!).pathname === "/slow") {
      let resolve!: () => void;
      const promise = new Promise<void>((done) => {
        resolve = done;
      });
      gates.set(storage.getStore()!, { promise, resolve });
    }
    await new Promise((resolve) => setTimeout(resolve, 1));
    if (new URL(context.href!).pathname === "/startup-error") {
      throw new Error("startup failed");
    }
    return {
      base: context.base ?? "/",
      enter: String(context.headers?.["x-enter"] ?? ""),
      id: storage.getStore() ?? "none",
      nonce: context.cspNonce,
    };
  },
  onResponse: (app) => ({
    headers: {
      "x-enter": app.enter,
      "x-context": app.id,
      "x-nonce": app.nonce ?? "",
    },
  }),
  onAppStop: () => {
    stops++;
  },
});
