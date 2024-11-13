import type { IndexHtmlTransformHook, Plugin } from "vite";

export function resolveHtmlTransforms(
  plugins: readonly Plugin[],
): [
  IndexHtmlTransformHook[],
  IndexHtmlTransformHook[],
  IndexHtmlTransformHook[],
] {
  const preHooks: IndexHtmlTransformHook[] = [];
  const normalHooks: IndexHtmlTransformHook[] = [];
  const postHooks: IndexHtmlTransformHook[] = [];

  for (const plugin of plugins) {
    const hook = plugin.transformIndexHtml;
    if (!hook) continue;

    if (typeof hook === "function") {
      normalHooks.push(hook);
    } else {
      const order = hook.order ?? (hook.enforce === "pre" ? "pre" : undefined);
      // @ts-expect-error union type
      const handler = hook.handler ?? hook.transform;
      if (order === "pre") {
        preHooks.push(handler);
      } else if (order === "post") {
        postHooks.push(handler);
      } else {
        normalHooks.push(handler);
      }
    }
  }

  return [preHooks, normalHooks, postHooks];
}
