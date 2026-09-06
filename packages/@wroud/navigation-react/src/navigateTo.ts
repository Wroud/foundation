"use client";
import type { INavigation, IRouteState } from "@wroud/navigation";
import type { CommitGate } from "./CommitGate.js";

export function navigateTo(
  navigation: INavigation,
  gate: CommitGate,
  to: IRouteState,
  replace: boolean | undefined,
): Promise<boolean> {
  const current = navigation.currentEntry?.state ?? null;
  const matcher = navigation.router.matcher;
  const sameDocument =
    current !== null && gate.tokenOf(to) === gate.tokenOf(current);
  const state = sameDocument
    ? { ...to, unknownQuery: current.unknownQuery }
    : to;
  const url = sameDocument ? matcher?.stateToUrl(state) : undefined;
  const sameUrl =
    typeof url === "string" && url === matcher?.stateToUrl(current);
  return replace || sameUrl
    ? navigation.replace(state)
    : navigation.navigate(state);
}
