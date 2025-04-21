import type { INodeState, ITreeData } from "@wroud/react-tree";
import {
  useCallback,
  useMemo,
  useRef,
  useSyncExternalStore,
  useState,
} from "react";
import {
  fetchDescribeById,
  fetchDocById,
  fetchStoryById,
  getRegistryChildren,
  getRegistryNode,
} from "@wroud/playground-react/registry";
import { useStoriesListener } from "@wroud/playground-react/views";

export function useStoriesTreeData(): ITreeData {
  const syncRef = useRef({});
  const [stateMap, setStateMap] = useState(() => new Map<string, INodeState>());

  const addListener = useStoriesListener(() => {
    syncRef.current = {};
    setStateMap(new Map());
  });
  const getCallback = useCallback(() => {
    return syncRef.current;
  }, []);

  const dataSync = useSyncExternalStore(addListener, getCallback, getCallback);

  return useMemo(
    () => ({
      rootId: "/",

      getNode(id: string) {
        const node = getRegistryNode(id);
        if (!node) return { name: id };

        switch (node.type) {
          case "story":
            const story = fetchStoryById(id);
            return {
              name: story?.name ?? id,
              tooltip: story?.options.description ?? undefined,
              leaf: true,
            };
          case "doc":
            const doc = fetchDocById(id);
            return {
              name: doc?.name ?? id,
              leaf: true,
            };
          case "describe":
            const describe = fetchDescribeById(id);
            return {
              name: describe?.name ?? id,
              leaf: false,
            };
          default:
            return {
              name: id,
              leaf: false,
            };
        }
      },

      getParent(id) {
        const node = getRegistryNode(id);
        if (!node) return null;
        return node.parent;
      },

      getChildren(nodeId: string) {
        return getRegistryChildren(nodeId)
          .sort((a, b) => {
            if (a.type === b.type) {
              return a.id.localeCompare(b.id);
            }

            const getTypePriority = (type: string) => {
              switch (type) {
                case "doc":
                  return 1;
                case "story":
                  return 2;
                case "describe":
                  return 3;
                default:
                  return 4;
              }
            };

            return getTypePriority(a.type) - getTypePriority(b.type);
          })
          .map((node) => node.id);
      },

      getState(id: string) {
        let state = stateMap.get(id);
        return (
          state || {
            expanded: true,
            selected: false,
          }
        );
      },

      updateState(
        id: string,
        state: Partial<{ expanded: boolean; selected: boolean }>,
      ) {
        const currentState = this.getState(id);

        setStateMap((stateMap) => {
          const newMap = new Map(stateMap);
          newMap.set(id, { ...currentState, ...state });
          return newMap;
        });
      },

      updateStateAll(state: Partial<{ expanded: boolean; selected: boolean }>) {
        setStateMap((stateMap) => {
          const newMap = new Map(stateMap);
          newMap.forEach((currentState, id) => {
            newMap.set(id, { ...currentState, ...state });
          });
          return newMap;
        });
      },
    }),
    [dataSync, stateMap],
  );
}
