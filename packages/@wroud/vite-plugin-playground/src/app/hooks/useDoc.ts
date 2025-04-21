import type { IDoc } from "../../IDoc.js";
import { useCallback, useSyncExternalStore } from "react";
import { subscribeToRegistryChanges } from "../../registry/listeners.js";
import { fetchDocById } from "../../registry/docs.js";

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
