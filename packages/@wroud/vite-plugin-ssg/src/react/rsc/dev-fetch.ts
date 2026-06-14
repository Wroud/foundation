import { AsyncLocalStorage } from "node:async_hooks";
import type { IndexComponentContext } from "../IndexComponent.js";

const INSTALLED = Symbol.for("@wroud/vite-plugin-ssg:dev-fetch");
const STORAGE = Symbol.for("@wroud/vite-plugin-ssg:dev-fetch-storage");

function getStorage(): AsyncLocalStorage<string> {
  const host = globalThis as Record<PropertyKey, unknown>;
  return ((host[STORAGE] as AsyncLocalStorage<string>) ??=
    new AsyncLocalStorage());
}

// Dev-only: run fn with the active request origin in AsyncLocalStorage so the
// patched fetch() below can resolve root-relative URLs against it and reach
// vite middlewares (e.g. the dev proxy) the same way the browser does. No
// credentials are attached; forward auth via the onAppStart context headers.
// Production code must use absolute URLs.
export function runWithDevFetch<T>(
  context: IndexComponentContext,
  fn: () => T,
): T {
  if (!import.meta.env.DEV || !context.href) {
    return fn();
  }
  let origin: string;
  try {
    origin = new URL(context.href).origin;
  } catch {
    return fn();
  }
  installDevFetch();
  return getStorage().run(origin, fn);
}

function installDevFetch(): void {
  const host = globalThis as Record<PropertyKey, unknown>;
  if (host[INSTALLED] || typeof window !== "undefined") {
    return;
  }
  host[INSTALLED] = true;

  const originalFetch = globalThis.fetch;
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const origin = getStorage().getStore();
    if (
      origin &&
      typeof input === "string" &&
      input.startsWith("/") &&
      !input.startsWith("//")
    ) {
      input = origin + input;
    }
    return originalFetch(input, init);
  }) as typeof fetch;
}
