"use client";
import { createContext, useContext, type Context } from "react";
import type {
  INavigation,
  INavigationEntry,
  IRouteState,
} from "@wroud/navigation";
import type { CommitGate } from "./CommitGate.js";

export interface NavigationContextValue {
  readonly navigation: INavigation;
  readonly gate: CommitGate;
  readonly prefetch: (state: IRouteState) => void;
}

export interface NavigationStateContextValue {
  readonly entry: INavigationEntry<IRouteState> | null;
  readonly pending: boolean;
}

export const NavigationContext = createContext<NavigationContextValue | null>(
  null,
);

export const NavigationStateContext =
  createContext<NavigationStateContextValue | null>(null);

function useRequired<T>(context: Context<T | null>): T {
  const value = useContext(context);
  if (value === null) {
    throw new Error("NavigationProvider is missing above this component");
  }
  return value;
}

export function useNavigationContext(): NavigationContextValue {
  return useRequired(NavigationContext);
}

export function useNavigationStateContext(): NavigationStateContextValue {
  return useRequired(NavigationStateContext);
}
