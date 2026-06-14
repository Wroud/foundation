"use client";

import { type ScriptHTMLAttributes } from "react";
import { pathUrlWithBase } from "../pathUrlWithBase.js";
import { useRenderContext } from "./RenderContext.js";

export interface ScriptProps extends ScriptHTMLAttributes<HTMLScriptElement> {
  forceNonce?: boolean;
}

export const Script: React.FC<ScriptProps> = function Script({
  src,
  nonce,
  forceNonce,
  ...rest
}) {
  const context = useRenderContext();
  const inline = rest.children != null || rest.dangerouslySetInnerHTML != null;
  return (
    <script
      src={pathUrlWithBase(context.base, src)}
      nonce={nonce ?? (forceNonce || inline ? context.cspNonce : undefined)}
      {...rest}
    />
  );
};
