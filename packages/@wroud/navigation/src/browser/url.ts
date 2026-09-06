import type { IRouteMatcher } from "../IRouteMatcher.js";
import type { IRouteState } from "../IRouteState.js";

export function currentUrl(): string {
  return (
    window.location.pathname + window.location.search + window.location.hash
  );
}

export function destinationToUrl(url: string): string {
  const parsed = new URL(url);
  return parsed.pathname + parsed.search + parsed.hash;
}

export function readKey(state: unknown): string | null {
  if (typeof state === "object" && state !== null) {
    const key = (state as { key?: unknown }).key;
    if (typeof key === "string") return key;
  }
  return null;
}

export function navigationApi(): Navigation | null {
  const nav = window.navigation;
  return nav &&
    typeof nav.addEventListener === "function" &&
    nav.currentEntry !== null
    ? nav
    : null;
}

export function urlToState(
  matcher: IRouteMatcher | null,
  url: string,
): IRouteState | null {
  return matcher?.urlToState(url) ?? null;
}

export function stateToUrl(
  matcher: IRouteMatcher | null,
  state: IRouteState | null,
): string | null {
  return state ? (matcher?.stateToUrl(state) ?? null) : null;
}

export function isBrowserAt(
  matcher: IRouteMatcher | null,
  state: IRouteState | null,
): boolean {
  if (!matcher || !state) return false;
  const target = matcher.stateToUrl({ ...state, unknownQuery: undefined });
  const current = matcher.urlToState(currentUrl());
  const at =
    current && matcher.stateToUrl({ ...current, unknownQuery: undefined });
  if (target == null || at == null) return false;
  const expected = new URL(target, window.location.href);
  const actual = new URL(at, window.location.href);
  return (
    expected.pathname === actual.pathname &&
    expected.search === actual.search &&
    expected.hash === actual.hash
  );
}
