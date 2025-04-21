# @wroud/react-split-view

[![ESM-only package][package]][esm-info-url]
[![NPM version][npm]][npm-url]

[package]: https://img.shields.io/badge/package-ESM--only-ffe536.svg
[esm-info-url]: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c
[npm]: https://img.shields.io/npm/v/@wroud/react-split-view.svg
[npm-url]: https://npmjs.com/package/@wroud/react-split-view

@wroud/react-split-view is a lightweight, flexible React hook for creating resizable split views. It enables users to create both horizontal and vertical split layouts with minimal configuration.

## Features

- **Simple API**: Create resizable split panes with a single hook.
- **Lightweight**: Minimal implementation with no external dependencies.
- **Flexible**: Support for both horizontal and vertical layouts.
- **Sticky Edges**: Optional snapping behavior when dragging near edges.
- **Multiple Splits**: Easily create complex nested layouts.
- **TypeScript**: Written in TypeScript for type safety.
- [Pure ESM package][esm-info-url]

## Installation

Install via npm:

```sh
npm install @wroud/react-split-view
```

Install via yarn:

```sh
yarn add @wroud/react-split-view
```

## Documentation

For detailed usage and API reference, visit the [documentation site](https://wroud.dev).

## Basic Usage

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

```tsx
function VerticalSplit() {
  const splitView = useSplitView<HTMLDivElement>();
  
  return (
    <div className="container" style={{ flexDirection: "column" }}>
      <div {...splitView.viewProps} className="panel">
        Top Panel
      </div>
      <div {...splitView.sashProps} className="sash" />
      <div className="panel">Bottom Panel</div>
    </div>
  );
}
```

## Advanced Features

### Sticky Edges

Add snapping behavior when dragging near the edges:

```tsx
const splitView = useSplitView<HTMLDivElement>({
  sticky: 20, // 20px sticky zone
});
```

### Multiple/Nested Splits

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
          <div {...secondSplit.sashProps} className="sash" />
          <div className="panel">Bottom-Right Panel</div>
        </div>
      </div>
    </div>
  );
}
```

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
