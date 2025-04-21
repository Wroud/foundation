---
title: Documentation
describe: '@wroud/react-split-view'
---

# @wroud/react-split-view

A lightweight, flexible React hook for creating resizable split views.

## Installation

```bash
npm install @wroud/react-split-view
```

## Basic Usage

The `useSplitView` hook provides everything needed to create resizable split panes. It returns props that can be spread onto your elements to enable drag-to-resize functionality.

### Horizontal Split (Default)

```tsx
import { useSplitView } from "@wroud/react-split-view";

function HorizontalSplit() {
  const splitView = useSplitView<HTMLDivElement>();
  
  return (
    <div className="container">
      <div {...splitView.viewProps} className="panel">
        Left Panel
      </div>
      <div {...splitView.sashProps} className="sash" />
      <div className="panel">Right Panel</div>
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

### Vertical Split

For vertical splits, simply set the container's `flexDirection` to `column` and adjust the sash cursor to `ns-resize`:

```tsx
function VerticalSplit() {
  const splitView = useSplitView<HTMLDivElement>();
  
  return (
    <div className="container" style={{ flexDirection: "column" }}>
      <div {...splitView.viewProps} className="panel">
        Top Panel
      </div>
      <div 
        {...splitView.sashProps} 
        className="sash" 
        style={{ cursor: "ns-resize" }}
      />
      <div className="panel">Bottom Panel</div>
    </div>
  );
}
```

For vertical splits, adjust the sash CSS:

```css
.sash {
  height: 4px;
  width: 100%;
  background-color: #ccc;
  cursor: ns-resize;
}
```

## Advanced Features

### Sticky Edges

You can add "sticky" behavior when dragging near the edges by specifying a sticky distance in pixels:

```tsx
function StickySplit() {
  const splitView = useSplitView<HTMLDivElement>({
    sticky: 20,
  });
  
  return (
    <div className="container">
      <div {...splitView.viewProps} className="panel">
        Left Panel (drag near edge to snap)
      </div>
      <div {...splitView.sashProps} className="sash" />
      <div className="panel">Right Panel</div>
    </div>
  );
}
```

### Multiple/Nested Splits

Create complex layouts by using multiple split view instances:

```tsx
function MultipleSplits() {
  const firstSplit = useSplitView<HTMLDivElement>();
  const secondSplit = useSplitView<HTMLDivElement>();

  return (
    <div className="container">
      <div {...firstSplit.viewProps} className="panel">
        Left Panel
      </div>
      <div {...firstSplit.sashProps} className="sash" />
      <div className="panel">
        <div className="container" style={{ flexDirection: "column" }}>
          <div {...secondSplit.viewProps} className="panel">
            Top-Right Panel
          </div>
          <div 
            {...secondSplit.sashProps} 
            className="sash" 
            style={{ cursor: "ns-resize" }}
          />
          <div className="panel">Bottom-Right Panel</div>
        </div>
      </div>
    </div>
  );
}
```

## API Reference

### useSplitView

```tsx
function useSplitView<T extends HTMLElement>(options?: SplitViewOptions): SplitViewResult<T>
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `sticky` | `number` | `undefined` | Distance in pixels from the edge at which the sash will "snap" to the edge |

#### Return Value

The hook returns an object with the following properties:

| Property | Type | Description |
|----------|------|-------------|
| `viewProps` | `object` | Props to be spread on the resizable view element |
| `sashProps` | `object` | Props to be spread on the sash (divider) element |

## Examples

### Code Editor with Preview

```tsx
function CodeEditorWithPreview() {
  const splitView = useSplitView<HTMLDivElement>();
  const [code, setCode] = useState("# Hello, world!");
  
  return (
    <div className="container">
      <div {...splitView.viewProps} className="panel editor">
        <textarea 
          value={code}
          onChange={(e) => setCode(e.target.value)}
          style={{ width: "100%", height: "100%" }}
        />
      </div>
      <div {...splitView.sashProps} className="sash" />
      <div className="panel preview">
        <div className="markdown-preview">
          {/* Render markdown preview */}
        </div>
      </div>
    </div>
  );
}
```

### File Explorer with Details Panel

```tsx
function FileExplorer() {
  const splitView = useSplitView<HTMLDivElement>({
    sticky: 15,
  });
  const [selectedFile, setSelectedFile] = useState(null);
  
  return (
    <div className="container">
      <div {...splitView.viewProps} className="panel file-tree">
        {/* File tree component */}
      </div>
      <div {...splitView.sashProps} className="sash" />
      <div className="panel file-details">
        {selectedFile ? (
          <div>
            <h2>{selectedFile.name}</h2>
            {/* File details */}
          </div>
        ) : (
          <div className="no-selection">
            Select a file to view details
          </div>
        )}
      </div>
    </div>
  );
}
```

### Three-Panel Layout

```tsx
function ThreePanelLayout() {
  const leftSplit = useSplitView<HTMLDivElement>();
  const rightSplit = useSplitView<HTMLDivElement>();
  
  return (
    <div className="container">
      <div {...leftSplit.viewProps} className="panel">
        Left Panel
      </div>
      <div {...leftSplit.sashProps} className="sash" />
      <div className="panel center">
        Center Panel
      </div>
      <div {...rightSplit.sashProps} className="sash" />
      <div {...rightSplit.viewProps} className="panel">
        Right Panel
      </div>
    </div>
  );
}
```

## Accessibility

The split view implements proper keyboard accessibility. Users can:
- Focus on the sash using Tab navigation
- Use arrow keys to resize the panels when the sash is focused
- Press Home/End to collapse/expand panels completely 
