import { AsyncLocalStorage } from "node:async_hooks";
import type { IRenderContext } from "./RenderContext.js";

const STORAGE = Symbol.for("@wroud/vite-plugin-ssg:render-context-storage");

function getStorage(): AsyncLocalStorage<IRenderContext> {
  const host = globalThis as Record<PropertyKey, unknown>;
  return ((host[STORAGE] as AsyncLocalStorage<IRenderContext>) ??=
    new AsyncLocalStorage());
}

export function useRenderContext(): IRenderContext {
  return getStorage().getStore() ?? { base: import.meta.env.BASE_URL };
}

export function runWithRenderContext<T>(
  value: IRenderContext,
  fn: () => T,
): T {
  return getStorage().run(value, fn);
}
