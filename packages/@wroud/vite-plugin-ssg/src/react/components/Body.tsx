import { type HTMLAttributes } from "react";

export interface BodyProps extends HTMLAttributes<HTMLBodyElement> {
  before?: React.ReactNode;
  after?: React.ReactNode;
  children?: React.ReactNode;
}

export const Body: React.FC<BodyProps> = function Body({
  before,
  after,
  children,
  ...rest
}) {
  return (
    <body {...rest}>
      {before}
      {children}
      {after}
    </body>
  );
};
