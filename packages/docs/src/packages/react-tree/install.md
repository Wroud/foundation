---
outline: deep
---

# Installation

<Badges name="@wroud/react-tree" />

Install with your favorite package manager, or check [CDN Usage](#cdn-usage) for other options:

::: code-group

```sh [npm]
npm install @wroud/react-tree
```

```sh [yarn]
yarn add @wroud/react-tree
```

```sh [pnpm]
pnpm add @wroud/react-tree
```

```sh [bun]
bun add @wroud/react-tree
```

:::

### CJS Usage

`@wroud/react-tree` is ESM-only. To use it from CommonJS, dynamically import the module:

```ts
async function main() {
  const { Tree } = await import("@wroud/react-tree");
}
```

### CDN Usage

For quick demos in the browser, load the module from [esm.sh](https://esm.sh) or [esm.run](https://esm.run):

```html
<script type="module">
  import { Tree } from "https://esm.sh/@wroud/react-tree@1.0.0";
</script>
```
