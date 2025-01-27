import { use, type ScriptHTMLAttributes } from "react";
import { pathUrlWithBase } from "../pathUrlWithBase.js";
import { SSGContext } from "./SSGContext.js";

export interface ScriptProps extends ScriptHTMLAttributes<HTMLScriptElement> {}

export const Script: React.FC<ScriptProps> = function Script({ src, ...rest }) {
  const { context } = use(SSGContext)!;

  return (
    <script
      src={pathUrlWithBase(context.base, src)}
      nonce={context.cspNonce}
      {...rest}
    />
  );
};
