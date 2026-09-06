"use client";
import { useNavigationStateContext } from "./NavigationContext.js";

export function useNavigationPending(): boolean {
  return useNavigationStateContext().pending;
}
