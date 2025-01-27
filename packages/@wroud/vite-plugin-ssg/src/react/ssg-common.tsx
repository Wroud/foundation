import type { HtmlTagDescriptor } from "vite";
import type { JSX } from "react";
import type { IndexComponentContext } from "./IndexComponent.js";
import { pathUrlWithBase } from "./pathUrlWithBase.js";

export function renderViteTags(
  tags: HtmlTagDescriptor[],
  context: IndexComponentContext,
  injectTo: HtmlTagDescriptor["injectTo"],
) {
  return <RenderViteTags tags={tags} injectTo={injectTo} context={context} />;
}

export interface IRenderViteTagsProps {
  tags: HtmlTagDescriptor[];
  injectTo: HtmlTagDescriptor["injectTo"];
  context: IndexComponentContext;
}

export function RenderViteTags({
  tags,
  injectTo,
  context,
}: IRenderViteTagsProps) {
  return (
    <>
      {tags
        .filter((tag) => tag.injectTo === injectTo)
        .map((tag, index) => (
          <RenderViteTag
            key={`${tag.tag}-${index}`}
            tag={tag}
            context={context}
          />
        ))}
    </>
  );
}

export interface IRenderViteTagProps {
  tag: HtmlTagDescriptor;
  context: IndexComponentContext;
}

export function RenderViteTag({ tag, context }: IRenderViteTagProps) {
  const Tag = tag.tag as keyof JSX.IntrinsicElements;
  const attrs = { ...tag.attrs };

  if (context.base) {
    if (typeof attrs["href"] === "string") {
      attrs["href"] = pathUrlWithBase(context.base, attrs["href"]);
    }

    if (typeof attrs["src"] === "string") {
      attrs["src"] = pathUrlWithBase(context.base, attrs["src"]);
    }

    if (typeof tag.children === "string") {
      tag.children = tag.children.replace('from "/', `from "${context.base}`);
    }

    if (tag.tag === "meta" && attrs["property"] === "base") {
      attrs["content"] = context.base;
    }
  }

  if (context.cspNonce) {
    if (attrs["nonce"] === "{{nonce}}") {
      attrs["nonce"] = context.cspNonce;
    }

    if (typeof tag.children === "string") {
      tag.children = tag.children.replace("{{nonce}}", context.cspNonce);
    }

    if (tag.tag === "script" && !attrs["nonce"]) {
      attrs["nonce"] = context.cspNonce;
    }
  }

  if (Array.isArray(tag.children)) {
    return (
      <Tag {...attrs}>
        <RenderViteTags
          tags={tag.children}
          injectTo={tag.injectTo}
          context={context}
        />
      </Tag>
    );
  }

  if (!tag.children) {
    return <Tag {...attrs} />;
  }

  return <Tag {...attrs} dangerouslySetInnerHTML={{ __html: tag.children }} />;
}
