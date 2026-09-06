"use client";
import { useCallback, useTransition } from "react";
import type { IRouteState } from "@wroud/navigation";
import { useNavigationContext } from "./NavigationContext.js";
import { navigateTo } from "./navigateTo.js";

export interface NavigateOptions {
  replace?: boolean;
}

export type Navigate = (
  to: IRouteState,
  options?: NavigateOptions,
) => Promise<boolean>;

export function useNavigate(): [Navigate, boolean] {
  const { navigation, gate } = useNavigationContext();
  const [pending, startTransition] = useTransition();
  const navigate = useCallback<Navigate>(
    (to, options) =>
      new Promise((resolve, reject) => {
        startTransition(async () => {
          try {
            resolve(await navigateTo(navigation, gate, to, options?.replace));
          } catch (error) {
            reject(error);
          }
        });
      }),
    [navigation, gate, startTransition],
  );
  return [navigate, pending];
}
