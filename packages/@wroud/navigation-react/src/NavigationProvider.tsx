"use client";
import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  NavigationType,
  type INavigation,
  type IRouteState,
} from "@wroud/navigation";
import { CommitGate } from "./CommitGate.js";
import type { LoadRoute } from "./LoadRoute.js";
import { markTransition } from "./markTransition.js";
import {
  NavigationContext,
  NavigationStateContext,
  type NavigationContextValue,
  type NavigationStateContextValue,
} from "./NavigationContext.js";

export interface NavigationProviderProps {
  navigation: INavigation;
  load?: LoadRoute;
  prefetch?: (state: IRouteState) => void;
  children?: ReactNode;
}

export function NavigationProvider({
  navigation,
  load,
  prefetch,
  children,
}: NavigationProviderProps): ReactElement {
  const [entry, setEntry] = useState(() => navigation.currentEntry);
  const [gate] = useState(() => new CommitGate(navigation));
  const [pending, startTransition] = useTransition();
  const loadRef = useRef(load);
  const prefetchRef = useRef(prefetch);

  useLayoutEffect(() => {
    loadRef.current = load;
    prefetchRef.current = prefetch;
  });

  useLayoutEffect(() => {
    let sequence = 0;
    function run(
      type: NavigationType,
      from: IRouteState | null,
      to: IRouteState | null,
    ) {
      const current = ++sequence;
      startTransition(async () => {
        markTransition(type);
        try {
          if (to && !gate.isMounted(gate.tokenOf(to))) {
            await loadRef.current?.(to, from, type);
          }
        } catch {
          if (current === sequence) gate.release();
        }
        startTransition(() => {
          setEntry(navigation.currentEntry);
        });
      });
    }
    const unsubscribe = navigation.addListener((type, from, to) => {
      const held = gate.wait(to);
      run(type, from, to);
      return held;
    });
    run(NavigationType.Navigate, null, navigation.currentEntry?.state ?? null);
    return unsubscribe;
  }, [navigation, gate]);

  const warm = useCallback(
    (state: IRouteState) => {
      if (!gate.isMounted(gate.tokenOf(state))) prefetchRef.current?.(state);
    },
    [gate],
  );

  const stable = useMemo<NavigationContextValue>(
    () => ({ navigation, gate, prefetch: warm }),
    [navigation, gate, warm],
  );
  const volatile = useMemo<NavigationStateContextValue>(
    () => ({ entry, pending }),
    [entry, pending],
  );

  return (
    <NavigationContext.Provider value={stable}>
      <NavigationStateContext.Provider value={volatile}>
        {children}
      </NavigationStateContext.Provider>
    </NavigationContext.Provider>
  );
}
