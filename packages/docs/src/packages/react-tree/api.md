---
outline: deep
---

# API

This page lists the main exports from `@wroud/react-tree`. See the source code for detailed comments (e.g., the `ITree` interface).

## Components

- **`Tree`** – top-level component that provides contexts and renders nodes.
- **`Node`** – renders a single tree node.
- **`NodeChildren`** – virtualized renderer for a node's children.
- **`TreeNodeControl`**, **`TreeNodeExpand`**, **`TreeNodeIcon`**, **`TreeNodeName`** – building blocks for custom node UIs.

## Hooks

- **`useTree`** – creates a tree controller implementing `ITree`.
- **`useNodeSizeCache`** – caches node heights for virtualization.
- **`useTreeViewport`** – tracks the visible range of the tree.

## Contexts

- **`TreeContext`**, **`TreeDataContext`**, **`NodeSizeCacheContext`**, **`TreeVirtualizationContext`**, **`TreeClassesContext`** – provide state and styling information.

## Utilities

- **`treeClasses`**, **`getCombinedClasses`** – default CSS classes and merging helper.

## Types

- `ITree`, `ITreeProps`, `ITreeData`
- `INode`, `INodeState`
- `NodeComponent`, `NodeComponentProps`
- `INodeSizeCache`, `IViewPort`, `ITreeVirtualization`, `UseTreeViewportResult`
- `ITreeClasses`

## Internals

- `NodeControl` and `NodeRenderer` are exported for reference when implementing custom nodes.
