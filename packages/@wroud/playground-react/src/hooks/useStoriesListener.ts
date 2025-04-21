import { useCallback, useRef } from "react";
import { subscribeToRegistryChanges } from "../registry.js";

export function useStoriesListener(callback?: () => void) {
  const callbackRef = useRef(callback);

  callbackRef.current = callback;

  return useCallback((callback: () => void) => {
    return subscribeToRegistryChanges(() => {
      callbackRef.current?.();
      callback();
    });
  }, []);
}
