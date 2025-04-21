// Main components
export { Tree } from "./tree/Tree.js";
export { Node } from "./node/Node.js";
export { NodeChildren } from "./node/NodeChildren.js";
// Re-export controls for custom implementations
export {
  TreeNodeControl,
  TreeNodeExpand,
  TreeNodeIcon,
  TreeNodeName,
} from "./controls/index.js";

// Hooks
export { useNodeSizeCache } from "./viewport/useNodeSizeCache.js";
export { useTreeViewport } from "./viewport/useTreeViewport.js";
export { useTree } from "./tree/useTree.js";

// Contexts
export { TreeContext } from "./tree/TreeContext.js";
export { TreeDataContext } from "./tree/TreeDataContext.js";
export { NodeSizeCacheContext } from "./viewport/NodeSizeCacheContext.js";
export { TreeVirtualizationContext } from "./viewport/TreeVirtualizationContext.js";
export { TreeClassesContext } from "./tree/TreeClassesContext.js";

// CSS classes
export { treeClasses, getCombinedClasses } from "./tree/treeClasses.js";

// Types
export type { ITree } from "./tree/ITree.js";
export type { ITreeProps } from "./tree/ITreeProps.js";
export type { ITreeData } from "./tree/ITreeData.js";
export type { INode } from "./node/INode.js";
export type { INodeState } from "./node/INodeState.js";
export type { INodeSizeCache } from "./viewport/useNodeSizeCache.js";
export type {
  NodeComponent,
  NodeComponentProps,
} from "./node/NodeComponent.js";
export type {
  IViewPort,
  ITreeVirtualization,
} from "./viewport/TreeVirtualizationContext.js";
export type { UseTreeViewportResult } from "./viewport/useTreeViewport.js";
export type { ITreeClasses } from "./tree/ITreeClasses.js";

// Internal implementation - available for reference but customers should create their own
export { NodeControl, type NodeControlProps } from "./node/NodeControl.js";
export { NodeRenderer } from "./node/NodeRenderer.js";
