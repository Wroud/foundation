import type { IStory } from "../../index.js";
import { useCallback, useSyncExternalStore } from "react";
import { fetchStoryById } from "../../registry/stories.js";
import { subscribeToRegistryChanges } from "../../registry/listeners.js";

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
