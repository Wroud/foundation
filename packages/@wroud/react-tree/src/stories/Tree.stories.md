---
title: Documentation
describe: '@wroud/react-tree'
---

# @wroud/react-tree

A highly performant and customizable React tree component with virtualization support.

## Features

- Virtualized rendering for handling large trees
- Expandable/collapsible nodes
- Node selection
- Custom node rendering
- Lazy loading of tree data

## Basic Usage

```tsx
import { Tree } from '@wroud/react-tree';
import { useCreateReactiveValue } from '@wroud/react-reactive-value';
import { useTree } from '@wroud/react-tree';

function MyTreeComponent() {
  // Define fixed node height
  const nodeHeight = useCreateReactiveValue(() => 24, null, []);
  
  // Create tree data
  const tree = useTree({
    data: {
      rootId: 'root',
      
      // Get node data by ID
      getNode: (id) => ({
        name: id === 'root' ? 'Root' : `Node ${id}`,
        leaf: id.includes('-2'), // Example of leaf nodes
        icon: 'folder' // Optional icon
      }),
      
      // Get children for a node
      getChildren: (nodeId) => {
        if (nodeId === 'root') return ['node-1', 'node-2', 'node-3'];
        if (nodeId === 'node-1') return ['node-1-1', 'node-1-2'];
        return [];
      },
      
      // Get node state (expanded/selected)
      getState: (id) => ({
        expanded: id === 'root',
        selected: false
      }),
      
      // Update state for a specific node
      updateState: (id, state) => {
        // Implement state updates
      },
      
      // Update state for all nodes
      updateStateAll: (state) => {
        // Implement state updates for all nodes
      }
    },
    
    // Optional callbacks
    onExpand: (nodeId, expanded) => console.log(`Node ${nodeId} ${expanded ? 'expanded' : 'collapsed'}`),
    onSelect: (nodeId, selected) => console.log(`Node ${nodeId} ${selected ? 'selected' : 'deselected'}`),
    onClick: (nodeId) => console.log(`Node ${nodeId} clicked`)
  });

  return (
    <div style={{ height: '500px' }}>
      <Tree tree={tree} nodeHeight={nodeHeight} />
    </div>
  );
}
```

## Custom Node Rendering

```tsx
import { Tree, TreeNodeControl, TreeNodeName, TreeNodeIcon } from '@wroud/react-tree';

function CustomNodeControl({ node, state, depth, onExpand, onSelect, onClick }) {
  return (
    <div className="custom-node" style={{ paddingLeft: `${depth * 16}px` }}>
      <TreeNodeControl node={node} state={state} onExpand={onExpand} />
      <TreeNodeIcon node={node} state={state} />
      <TreeNodeName node={node} state={state} onClick={onClick} />
      {node.id !== 'root' && <span className="custom-badge">{node.id}</span>}
    </div>
  );
}

function MyCustomTreeComponent() {
  // ... tree setup as in basic example
  
  return (
    <div style={{ height: '500px' }}>
      <Tree 
        tree={tree} 
        nodeHeight={nodeHeight}
        controlRenderer={CustomNodeControl}
      />
    </div>
  );
}
```

## Lazy Loading

The tree supports lazy loading of nodes through the optional `load` method in the tree data:

```tsx
const tree = useTree({
  data: {
    // ... other required methods
    
    // Async method to load children when a node is expanded
    async load(nodeId, manual) {
      // Simulate API call
      const children = await fetchChildrenFromAPI(nodeId);
      
      // Update your internal data structure with new children
      // Then update the tree to trigger re-render
    }
  }
});
```
