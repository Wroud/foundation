import type {
  HtmlTagDescriptor,
  IndexHtmlTransformContext,
  IndexHtmlTransformHook,
} from "vite";

export async function resolveHtmlTags(
  html: string,
  ctx: IndexHtmlTransformContext,
  preHooks: IndexHtmlTransformHook[],
  normalHooks: IndexHtmlTransformHook[],
  postHooks: IndexHtmlTransformHook[],
): Promise<HtmlTagDescriptor[]> {
  let tags: HtmlTagDescriptor[] = [];
  for (const hook of [...preHooks, ...normalHooks, ...postHooks]) {
    const res = await hook(html, ctx);
    if (!res) {
      continue;
    }
    if (Array.isArray(res)) {
      tags = res;
    }
  }
  return tags;
}
