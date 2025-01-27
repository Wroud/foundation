import { use, type HTMLAttributes } from "react";
import { SSGContext } from "./SSGContext.js";

export interface HeadProps extends HTMLAttributes<HTMLHeadElement> {
  before?: React.ReactNode;
  after?: React.ReactNode;
  children?: React.ReactNode;
}

export const Head: React.FC<HeadProps> = function Head({
  before,
  after,
  children,
  ...rest
}) {
  const { renderTags, context } = use(SSGContext)!;
  return (
    <head {...rest}>
      {before}
      {renderTags()}
      {renderTags("head-prepend")}
      {children}
      {renderTags("head")}
      {context.base !== undefined && (
        <meta property="base" content={context.base} />
      )}
      {after}
    </head>
  );
};
