import { use, type LinkHTMLAttributes } from "react";
import { pathUrlWithBase } from "../pathUrlWithBase.js";
import { SSGContext } from "./SSGContext.js";

export interface LinkProps extends LinkHTMLAttributes<HTMLLinkElement> {}

export const Link: React.FC<LinkProps> = function Link({ href, ...rest }) {
  const { context } = use(SSGContext)!;

  return (
    <link
      href={pathUrlWithBase(context.base, href)}
      nonce={context.cspNonce}
      {...rest}
    />
  );
};
