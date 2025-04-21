import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import type { MouseEvent } from "react";
import { TreeContext } from "../tree/TreeContext.js";

interface TreeNodeContextValue {
  nodeId: string;
  toggle: (event: MouseEvent) => void;
  select: () => void;
  click: (event: MouseEvent) => void;
}

export const TreeNodeContext = createContext<TreeNodeContextValue | null>(null);

interface TreeNodeProviderProps {
  nodeId: string;
  children: ReactNode;
}

export function TreeNodeProvider({ nodeId, children }: TreeNodeProviderProps) {
  const tree = useContext(TreeContext)!;

  const toggle = useCallback(
    (event: MouseEvent) => {
      event.stopPropagation();
      const expanded = tree.isExpanded(nodeId);
      tree.expandNode(nodeId, !expanded, true);
    },
    [tree, nodeId],
  );

  const select = useCallback(() => {
    tree.selectNode(nodeId, true);
  }, [tree, nodeId]);

  const click = useCallback(
    (event: MouseEvent) => {
      tree.clickNode(nodeId, event);
    },
    [tree, nodeId],
  );

  const value = useMemo(
    () => ({
      nodeId,
      toggle,
      select,
      click,
    }),
    [nodeId, toggle, select, click],
  );

  return (
    <TreeNodeContext.Provider value={value}>
      {children}
    </TreeNodeContext.Provider>
  );
}

export function useTreeNode() {
  const context = useContext(TreeNodeContext);
  if (!context) {
    throw new Error("useTreeNode must be used within a TreeNodeProvider");
  }
  return context;
}
