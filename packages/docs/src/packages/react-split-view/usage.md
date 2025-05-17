---
outline: deep
---

# Usage

The `useSplitView` hook provides everything needed to create resizable split panes. It returns props that can be spread on your elements to enable drag-to-resize functionality.

## Horizontal Split (default)

```tsx
import { useSplitView } from "@wroud/react-split-view";

function Example() {
  const split = useSplitView<HTMLDivElement>();
  return (
    <div className="container">
      <div {...split.viewProps} className="panel">
        Left
      </div>
      <div {...split.sashProps} className="sash" />
      <div className="panel">Right</div>
    </div>
  );
}
```

Required CSS:

```css
.container {
  display: flex;
  width: 100%;
  height: 100%;
}

.panel {
  flex: 1;
  overflow: auto;
}

.sash {
  width: 4px;
  background-color: #ccc;
  cursor: ew-resize;
}
```

## Vertical Split

```tsx
function Vertical() {
  const split = useSplitView<HTMLDivElement>();
  return (
    <div className="container" style={{ flexDirection: "column" }}>
      <div {...split.viewProps} className="panel">
        Top
      </div>
      <div {...split.sashProps} className="sash" />
      <div className="panel">Bottom</div>
    </div>
  );
}
```

## Advanced Features

### Sticky Edges

Enable snapping when the sash is near the container edge.

```tsx
const split = useSplitView<HTMLDivElement>({
  sticky: 20, // pixels from the edge
});
```

### Multiple Splits

```tsx
function MultipleSplits() {
  const first = useSplitView<HTMLDivElement>();
  const second = useSplitView<HTMLDivElement>();

  return (
    <div className="container">
      <div {...first.viewProps} className="panel">
        Left
      </div>
      <div {...first.sashProps} className="sash" />
      <div className="panel">
        <div className="container" style={{ flexDirection: "column" }}>
          <div {...second.viewProps} className="panel">
            Top Right
          </div>
          <div {...second.sashProps} className="sash" />
          <div className="panel">Bottom Right</div>
        </div>
      </div>
    </div>
  );
}
```
