import { useCallback, useSyncExternalStore } from "react";
import { subscribeToRegistryChanges } from "../../registry/listeners.js";
import { getRegistryNode, type INode } from "../../registry/tree.js";

export function useNode(id: string | null): INode | null {
  const getCallback = useCallback(() => {
    if (!id) {
      return null;
    }

    return getRegistryNode(id) ?? null;
  }, [id]);

  const node = useSyncExternalStore(
    subscribeToRegistryChanges,
    getCallback,
    getCallback,
  );

  return node;
}
