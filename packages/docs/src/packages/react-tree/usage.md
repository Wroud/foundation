---
outline: deep
---

# Usage

This example shows a basic tree setup using the `useTree` hook and the `Tree` component. Node height is stored in a reactive value so virtualization can calculate offsets.

```tsx
import { Tree, useTree } from "@wroud/react-tree";
import { useCreateReactiveValue } from "@wroud/react-reactive-value";

const data = {
  rootId: "root",
  getNode(id: string) {
    return { name: id === "root" ? "Root" : `Node ${id}` };
  },
  getChildren(id: string) {
    return id === "root" ? ["a", "b", "c"] : [];
  },
  getState() {
    return { expanded: true, selected: false };
  },
  updateState() {},
  updateStateAll() {},
};

function App() {
  const nodeHeight = useCreateReactiveValue(() => 24, null, []);
  const tree = useTree({ data });

  return (
    <div style={{ height: 300 }}>
      <Tree tree={tree} nodeHeight={nodeHeight} />
    </div>
  );
}
```

### Custom Control Renderer

You can override how each node is displayed by providing a `controlRenderer`.

```tsx
import {
  TreeNodeControl,
  TreeNodeExpand,
  TreeNodeName,
} from "@wroud/react-tree";

function CustomControl({ nodeId }) {
  return (
    <TreeNodeControl>
      <TreeNodeExpand />
      <TreeNodeName>{`Custom ${nodeId}`}</TreeNodeName>
    </TreeNodeControl>
  );
}

<Tree tree={tree} nodeHeight={nodeHeight} controlRenderer={CustomControl} />;
```

### Lazy Loading

`getChildren` can return a promise so nodes load as needed:

```ts
const tree = useTree({
  data: {
    rootId: "root",
    async getChildren(id) {
      return fetchChildren(id);
    },
    getNode() {
      return { name: "" };
    },
    getState() {
      return { expanded: false, selected: false };
    },
    updateState() {},
    updateStateAll() {},
  },
});
```
