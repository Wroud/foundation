import type { ITreeData } from "./ITreeData.js";

export interface ITree {
  data: ITreeData;

  /**
   * Expands or collapses a node, triggering data loading if necessary
   * @param nodeId ID of the node to expand or collapse
   * @param expand If true, the node will be expanded. If false, it will be collapsed.
   * @param manual Indicates if this expansion was triggered manually by user interaction
   * @returns Promise that resolves when expansion and any loading is complete
   */
  expandNode(nodeId: string, expand: boolean, manual?: boolean): Promise<void>;

  /**
   * Checks if a node is currently expanded
   * @param nodeId ID of the node to check
   * @returns True if the node is expanded, false otherwise
   */
  isExpanded(nodeId: string): boolean;

  /**
   * Checks if a node is currently selected
   * @param nodeId ID of the node to check
   * @returns True if the node is selected, false otherwise
   */
  isSelected(nodeId: string): boolean;

  /**
   * Selects or deselects a node
   * @param nodeId ID of the node to select or deselect
   * @param select If true, the node will be selected. If false, it will be deselected.
   */
  selectNode(nodeId: string, select: boolean): void;

  /**
   * Handles a click event on a node
   * @param nodeId ID of the node that was clicked
   * @param event Optional original click event. Can be omitted for programmatic calls.
   */
  clickNode(nodeId: string, event?: React.MouseEvent): void;
}
