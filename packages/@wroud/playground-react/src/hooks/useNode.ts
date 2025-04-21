import { useCallback, useSyncExternalStore } from "react";
import {
  getRegistryNode,
  subscribeToRegistryChanges,
  type INode,
} from "../registry.js";

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
