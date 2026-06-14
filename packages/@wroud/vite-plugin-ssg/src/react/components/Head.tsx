import { type HTMLAttributes } from "react";

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
  return (
    <head {...rest}>
      {before}
      {children}
      {after}
    </head>
  );
};
