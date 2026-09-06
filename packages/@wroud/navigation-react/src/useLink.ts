"use client";
import { useTransition, type MouseEvent } from "react";
import type { IRouteState } from "@wroud/navigation";
import { useNavigationContext } from "./NavigationContext.js";
import { navigateTo } from "./navigateTo.js";

export interface UseLinkOptions {
  to: IRouteState;
  replace?: boolean;
}

export interface UseLinkResult {
  href: string | undefined;
  pending: boolean;
  onClick: (event: MouseEvent<HTMLAnchorElement>) => void;
}

export function useLink({ to, replace }: UseLinkOptions): UseLinkResult {
  const { navigation, gate } = useNavigationContext();
  const [pending, startTransition] = useTransition();
  const href = navigation.router.matcher?.stateToUrl(to) ?? undefined;
  function onClick(event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();
    startTransition(async () => {
      await navigateTo(navigation, gate, to, replace);
    });
  }
  return { href, pending, onClick };
}
