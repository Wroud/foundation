"use client";
import { useLayoutEffect } from "react";
import type { IRouteState } from "@wroud/navigation";
import { useNavigationContext } from "./NavigationContext.js";

export interface RouteCommittedProps {
  state: IRouteState | null;
}

export function RouteCommitted({ state }: RouteCommittedProps): null {
  const { gate } = useNavigationContext();
  const token = gate.tokenOf(state);
  useLayoutEffect(() => {
    gate.mount(token);
    return () => gate.unmount(token);
  }, [gate, token]);
  return null;
}
