"use client";
import type {
  AnchorHTMLAttributes,
  FocusEvent,
  MouseEvent,
  PointerEvent,
  ReactElement,
  Ref,
} from "react";
import type { IRouteState } from "@wroud/navigation";
import { useNavigationContext } from "./NavigationContext.js";
import { useLink } from "./useLink.js";

export interface LinkProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  to: IRouteState;
  replace?: boolean;
  ref?: Ref<HTMLAnchorElement>;
}

export function Link({
  to,
  replace,
  target,
  onClick,
  onPointerEnter,
  onFocus,
  ...rest
}: LinkProps): ReactElement {
  const { prefetch } = useNavigationContext();
  const { href, pending, onClick: navigate } = useLink({ to, replace });
  const intercept = !target || target === "_self";

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (intercept) navigate(event);
  }
  function handlePointerEnter(event: PointerEvent<HTMLAnchorElement>) {
    onPointerEnter?.(event);
    if (intercept) prefetch(to);
  }
  function handleFocus(event: FocusEvent<HTMLAnchorElement>) {
    onFocus?.(event);
    if (intercept) prefetch(to);
  }

  return (
    <a
      {...rest}
      href={href}
      target={target}
      data-status={pending ? "pending" : undefined}
      onClick={handleClick}
      onPointerEnter={handlePointerEnter}
      onFocus={handleFocus}
    />
  );
}
