import { use, type HTMLAttributes } from "react";
import { Script } from "./Script.js";
import { SSGContext } from "./SSGContext.js";

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
  const { renderTags, mainScriptUrl } = use(SSGContext)!;
  return (
    <body {...rest}>
      {before}
      {renderTags("body-prepend")}
      {children}
      {renderTags("body")}
      {mainScriptUrl && <Script type="module" src={mainScriptUrl} />}
      {after}
    </body>
  );
};
