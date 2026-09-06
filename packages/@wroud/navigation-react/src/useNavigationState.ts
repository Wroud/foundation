"use client";
import type { IRouteState } from "@wroud/navigation";
import { useNavigationStateContext } from "./NavigationContext.js";

export function useNavigationState(): IRouteState | null {
  return useNavigationStateContext().entry?.state ?? null;
}
