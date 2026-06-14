"use client";

import { type LinkHTMLAttributes } from "react";
import { pathUrlWithBase } from "../pathUrlWithBase.js";
import { useRenderContext } from "./RenderContext.js";

export interface LinkProps extends LinkHTMLAttributes<HTMLLinkElement> {}

export const Link: React.FC<LinkProps> = function Link({
  href,
  nonce,
  ...rest
}) {
  const context = useRenderContext();
  return (
    <link
      href={pathUrlWithBase(context.base, href)}
      nonce={nonce ?? context.cspNonce}
      {...rest}
    />
  );
};
