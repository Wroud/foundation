import { use, type ScriptHTMLAttributes } from "react";
import { pathUrlWithBase } from "../pathUrlWithBase.js";
import { SSGContext } from "./SSGContext.js";

export interface ScriptProps extends ScriptHTMLAttributes<HTMLScriptElement> {
  forceNonce?: boolean;
}

export const Script: React.FC<ScriptProps> = function Script({
  src,
  forceNonce,
  ...rest
}) {
  const { context } = use(SSGContext)!;

  return (
    <script
      src={pathUrlWithBase(context.base, src)}
      nonce={rest.children || forceNonce ? context.cspNonce : undefined}
      {...rest}
    />
  );
};
