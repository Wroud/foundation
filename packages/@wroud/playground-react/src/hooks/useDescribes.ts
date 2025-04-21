import { useCallback, useRef, useSyncExternalStore } from "react";
import { useStoriesListener } from "./useStoriesListener.js";
import type { IDescribe } from "../IDescribe.js";
import { fetchChildDescribes } from "../registry.js";

export function useDescribes(root: string) {
  const cacheRef = useRef<IDescribe[] | null>(null);

  const addListener = useStoriesListener(() => {
    cacheRef.current = null;
  });
  const getDescribesCallback = useCallback(() => {
    if (cacheRef.current === null) {
      cacheRef.current = fetchChildDescribes(root);
    }
    return cacheRef.current;
  }, [root]);

  const describes = useSyncExternalStore(
    addListener,
    getDescribesCallback,
    getDescribesCallback,
  );

  return describes;
}
