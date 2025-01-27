import { type ForwardedRef, type HtmlHTMLAttributes } from "react";
import { SSGContext } from "./SSGContext.js";
import type { IndexComponentProps } from "../IndexComponent.js";

export interface HtmlProps
  extends IndexComponentProps,
    HtmlHTMLAttributes<HTMLHtmlElement> {
  ref?: ForwardedRef<HTMLHtmlElement>;
}

export const Html: React.FC<HtmlProps> = function Html({
  context,
  renderTags,
  mainScriptUrl,
  ...rest
}) {
  return (
    <SSGContext value={{ context, renderTags, mainScriptUrl }}>
      <html {...rest} />
    </SSGContext>
  );
};
