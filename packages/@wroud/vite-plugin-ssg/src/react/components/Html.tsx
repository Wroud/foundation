import { type ForwardedRef, type HtmlHTMLAttributes } from "react";

export interface HtmlProps extends HtmlHTMLAttributes<HTMLHtmlElement> {
  ref?: ForwardedRef<HTMLHtmlElement>;
}

export const Html: React.FC<HtmlProps> = function Html({ ...rest }) {
  return <html {...rest} />;
};
