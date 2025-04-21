import { useCallback, useMemo } from "react";
import type { ITreeData } from "./ITreeData.js";
import type { ITree } from "./ITree.js";

interface UseTreeOptions {
  data: ITreeData;
  onExpand?: (nodeId: string, expanded: boolean) => void;
  onSelect?: (nodeId: string, selected: boolean) => void;
  onClick?: (nodeId: string, event?: React.MouseEvent) => void;
}

/**
 * Hook that encapsulates tree-related logic
 * Provides methods for managing tree node expansion and checking node states
 */
export function useTree({
  data,
  onExpand,
  onSelect,
  onClick,
}: UseTreeOptions): ITree {
  /**
   * Checks if a node is currently expanded
   */
  const isExpanded = useCallback(
    (nodeId: string): boolean => {
      return data.getState(nodeId).expanded;
    },
    [data],
  );

  /**
   * Checks if a node is currently selected
   */
  const isSelected = useCallback(
    (nodeId: string): boolean => {
      return data.getState(nodeId).selected;
    },
    [data],
  );

  /**
   * Selects or deselects a node
   */
  const selectNode = useCallback(
    (nodeId: string, select: boolean): void => {
      const currentState = data.getState(nodeId);

      // If already in the desired state, do nothing
      if (currentState.selected === select) {
        return;
      }

      // Update the selected state
      data.updateState(nodeId, { selected: select });

      // Call the onSelect callback if provided
      if (onSelect) {
        onSelect(nodeId, select);
      }
    },
    [data, onSelect],
  );

  /**
   * Handles a click event on a node
   * Supports both UI-triggered clicks (with event) and programmatic calls (without event)
   */
  const clickNode = useCallback(
    (nodeId: string, event?: React.MouseEvent): void => {
      // Select the node when clicked
      selectNode(nodeId, true);

      // Call the onClick callback if provided
      if (onClick) {
        onClick(nodeId, event);
      }
    },
    [onClick, selectNode],
  );

  /**
   * Handles expanding/collapsing a node with data loading if needed
   * Simplified logic: updates state first, then loads data if needed
   */
  const expandNode = useCallback(
    async (nodeId: string, expand: boolean, manual = false): Promise<void> => {
      const currentState = data.getState(nodeId);

      // If already in the desired state, do nothing
      if (currentState.expanded === expand) {
        return;
      }

      if (data.getParent) {
        const parentId = data.getParent(nodeId);
        if (parentId) {
          expandNode(parentId, true, manual);
        }
      }

      // Update state first
      data.updateState(nodeId, { expanded: expand });

      // Call the onExpand callback if provided
      if (onExpand) {
        onExpand(nodeId, expand);
      }

      // If expanding, try to load children and collapse if empty
      if (expand && data.load) {
        try {
          await data.load(nodeId, manual);
          const children = data.getChildren(nodeId);

          // Auto-collapse if no children were loaded
          if (children.length === 0) {
            data.updateState(nodeId, { expanded: false });

            // Notify about the auto-collapse if callback provided
            if (onExpand) {
              onExpand(nodeId, false);
            }
          }
        } catch (error) {
          // If loading fails, collapse the node
          data.updateState(nodeId, { expanded: false });

          // Notify about the collapse due to error
          if (onExpand) {
            onExpand(nodeId, false);
          }

          // Re-throw to allow proper error handling
          throw error;
        }
      }
    },
    [data, onExpand],
  );

  return useMemo(
    () => ({
      data,
      expandNode,
      isExpanded,
      isSelected,
      selectNode,
      clickNode,
    }),
    [data, expandNode, isExpanded, isSelected, selectNode, clickNode],
  );
}
