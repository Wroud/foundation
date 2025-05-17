---
outline: deep
---

# API

## useSplitView

```ts
function useSplitView<T extends HTMLElement>(options?: {
  sticky?: number;
}): {
  viewProps: React.HTMLAttributes<T>;
  sashProps: React.HTMLAttributes<HTMLElement>;
};
```

`useSplitView` is part of a pure ESM package and provides typed helpers for managing split panes.

### Options

| Option   | Type   | Description                                                |
| -------- | ------ | ---------------------------------------------------------- |
| `sticky` | number | Distance in pixels from the edge where the sash will snap. |

### Return Value

- `viewProps` – props to spread on the resizable element.
- `sashProps` – props to spread on the divider element for drag handling.
