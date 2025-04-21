import { useCallback, useRef, useSyncExternalStore } from "react";
import { useStoriesListener } from "./useStoriesListener.js";
import type { IStory } from "../IStory.js";
import { fetchStoriesForDescribe } from "../registry.js";

/**
 * Hook to get stories for a specific describe and update when stories change
 */
export function useStories(describe: string): IStory[] {
  const cacheRef = useRef<IStory[] | null>(null);

  const addListener = useStoriesListener(() => {
    cacheRef.current = null;
  });

  const getStoriesCallback = useCallback(() => {
    if (cacheRef.current === null) {
      cacheRef.current = fetchStoriesForDescribe(describe);
    }
    return cacheRef.current;
  }, [describe]);

  const stories = useSyncExternalStore(
    addListener,
    getStoriesCallback,
    getStoriesCallback,
  );

  return stories;
}
