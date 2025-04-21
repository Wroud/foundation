# @wroud/react-tree

[![ESM-only package][package]][esm-info-url]
[![NPM version][npm]][npm-url]

<!-- [![Install size][size]][size-url] -->

[package]: https://img.shields.io/badge/package-ESM--only-ffe536.svg
[esm-info-url]: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c
[npm]: https://img.shields.io/npm/v/@wroud/react-tree.svg
[npm-url]: https://npmjs.com/package/@wroud/react-tree
[size]: https://packagephobia.com/badge?p=@wroud/react-tree
[size-url]: https://packagephobia.com/result?p=@wroud/react-tree

@wroud/react-tree is a lightweight, highly customizable, and virtualized tree component for React applications. It provides efficient rendering of large hierarchical data structures with built-in support for expanding, collapsing, and selecting nodes.

## Features

- **Virtualization**: Renders only visible nodes, enabling smooth performance with thousands of nodes
- **Customizable**: Easily customize node appearance and behavior
- **Dynamic Loading**: Support for asynchronous loading of node children
- **Selection Management**: Built-in node selection functionality
- **Type Safety**: Written in TypeScript for robust development
- [Pure ESM package][esm-info-url]

## Installation

Install via npm:

```sh
npm install @wroud/react-tree
```

Install via yarn:

```sh
yarn add @wroud/react-tree
```

## Documentation

For detailed usage and API reference, visit the [documentation site](https://wroud.dev).

## Basic Usage

```tsx
import { Tree, useTree } from "@wroud/react-tree";
import { useCreateReactiveValue } from "@wroud/react-reactive-value";

// Define your tree data structure
const treeData = {
  rootId: "root",
  
  getNode(id: string) {
    // Return node information (name, leaf status, etc.)
    return { name: id === "root" ? "Root" : `Node ${id}` };
  },
  
  getChildren(nodeId: string) {
    // Return array of child node IDs
    if (nodeId === "root") {
      return ["item1", "item2", "item3"];
    }
    return [];
  },
  
  getState(id: string) {
    // Return node state (expanded, selected)
    return { expanded: id === "root", selected: false };
  },
  
  updateState(id: string, state) {
    // Handle state updates for nodes
    console.log(`Updating ${id} with state:`, state);
  },
  
  updateStateAll(state) {
    // Handle batch state updates
  }
};

function MyTreeComponent() {
  // Create a stable reactive value for node height
  const nodeHeight = useCreateReactiveValue(() => 24, null, []);
  
  // Create tree instance with the data
  const tree = useTree({ data: treeData });
  
  return (
    <div style={{ height: "400px" }}>
      <Tree 
        tree={tree} 
        nodeHeight={nodeHeight} 
      />
    </div>
  );
}
```

## Custom Node Rendering

You can customize how nodes are rendered:

```tsx
import { TreeNodeControl, TreeNodeExpand, TreeNodeName } from "@wroud/react-tree";

// Custom control renderer
function CustomNodeRenderer({ nodeId }) {
  return (
    <TreeNodeControl>
      <TreeNodeExpand />
      <TreeNodeName>{`Custom Node ${nodeId}`}</TreeNodeName>
    </TreeNodeControl>
  );
}

// Then use it in your Tree
<Tree
  tree={tree}
  nodeHeight={nodeHeight}
  controlRenderer={CustomNodeRenderer}
/>
```

## Changelog

All notable changes to this project will be documented in the [CHANGELOG](./CHANGELOG.md) file.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
