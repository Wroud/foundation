---
outline: deep
---

# Installation

<Badges name="@wroud/react-split-view" />

Install with your favorite package manager, or check [CDN Usage](#cdn-usage) for other options:

::: code-group

```sh [npm]
npm install @wroud/react-split-view
```

```sh [yarn]
yarn add @wroud/react-split-view
```

```sh [pnpm]
pnpm add @wroud/react-split-view
```

```sh [bun]
bun add @wroud/react-split-view
```

:::

### CJS Usage

`@wroud/react-split-view` is an ESM-only package. To use it in a CommonJS environment, dynamically import the module:

```ts
async function main() {
  const { useSplitView } = await import("@wroud/react-split-view");
  // ...
}
```

### CDN Usage

For browser usage without bundling, load the module from [esm.sh](https://esm.sh) or [esm.run](https://esm.run):

```html
<script type="module">
  import { useSplitView } from "https://esm.sh/@wroud/react-split-view@1.0.0";
</script>
```
