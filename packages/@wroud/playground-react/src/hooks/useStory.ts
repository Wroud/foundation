import { useCallback, useSyncExternalStore } from "react";
import type { IStory } from "../IStory.js";
import { fetchStoryById, subscribeToRegistryChanges } from "../registry.js";

export function useStory(id: string | null): IStory | null {
  const getStoryCallback = useCallback(() => {
    if (!id) {
      return null;
    }

    return fetchStoryById(id) ?? null;
  }, [id]);

  const story = useSyncExternalStore(
    subscribeToRegistryChanges,
    getStoryCallback,
    getStoryCallback,
  );

  return story;
}
