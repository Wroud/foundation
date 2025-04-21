import { useMemo } from "react";

import type { ITreeData } from "../tree/ITreeData.js";
import {
  type IReactiveValue,
  useReactiveValues,
} from "@wroud/react-reactive-value";

export interface INodeSizeCache {
  getNodeHeight(id: string): number;
  getSize(id: string): number;
}

export function useNodeSizeCache(
  nodeHeight: IReactiveValue<number, [nodeId: string]>,
  treeData: ITreeData,
): INodeSizeCache {
  const cache = useMemo(() => new Map<string, number>(), [treeData]);
  const getNodeHeight = useReactiveValues(nodeHeight, (nodeId) => {
    cache.delete(nodeId);
  });

  return useMemo(
    () => ({
      getNodeHeight(id: string): number {
        if (treeData.rootId === id) {
          return 0;
        }
        return getNodeHeight(id);
      },
      getSize(id: string): number {
        if (cache.has(id)) {
          return cache.get(id)!;
        }

        let size = this.getNodeHeight(id);

        const expanded = treeData.getState(id).expanded;

        if (expanded) {
          const children = treeData.getChildren(id);

          for (const child of children) {
            size += this.getSize(child);
          }
        }

        cache.set(id, size);
        return size;
      },
    }),
    [getNodeHeight, cache],
  );
}
