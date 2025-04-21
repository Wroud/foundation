import { useCallback, useSyncExternalStore } from "react";
import type { IDoc } from "../IDoc.js";
import { fetchDocById, subscribeToRegistryChanges } from "../registry.js";

export function useDoc(id: string | null): IDoc | null {
  const getCallback = useCallback(() => {
    if (!id) {
      return null;
    }

    return fetchDocById(id) ?? null;
  }, [id]);

  const doc = useSyncExternalStore(
    subscribeToRegistryChanges,
    getCallback,
    getCallback,
  );

  return doc;
}
