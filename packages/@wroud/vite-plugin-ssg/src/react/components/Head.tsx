import type { HTMLAttributes } from "react";
import type { IndexComponentProps } from "../IndexComponent.js";

export interface HeadProps
  extends IndexComponentProps,
    HTMLAttributes<HTMLHeadElement> {
  before?: React.ReactNode;
  after?: React.ReactNode;
  children?: React.ReactNode;
}

export const Head: React.FC<HeadProps> = function Head({
  before,
  after,
  children,
  context,
  renderTags,
  ...rest
}) {
  return (
    <head {...rest}>
      {before}
      {renderTags()}
      {renderTags("head-prepend")}
      {children}
      {renderTags("head")}
      {after}
    </head>
  );
};
