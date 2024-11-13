import type { HTMLAttributes } from "react";
import type { IndexComponentProps } from "../IndexComponent.js";

export interface BodyProps
  extends IndexComponentProps,
    HTMLAttributes<HTMLBodyElement> {
  before?: React.ReactNode;
  after?: React.ReactNode;
  children?: React.ReactNode;
}

export const Body: React.FC<BodyProps> = function Body({
  before,
  after,
  children,
  context,
  renderTags,
  ...rest
}) {
  return (
    <body {...rest}>
      {before}
      {renderTags("body-prepend")}
      {children}
      {renderTags("body")}
      {after}
    </body>
  );
};
