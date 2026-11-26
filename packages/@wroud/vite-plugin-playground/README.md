# @wroud/vite-plugin-playground

[![ESM-only package][package]][esm-info-url]
[![NPM version][npm]][npm-url]

[package]: https://img.shields.io/badge/package-ESM--only-ffe536.svg
[esm-info-url]: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c
[npm]: https://img.shields.io/npm/v/@wroud/vite-plugin-playground.svg
[npm-url]: https://npmjs.com/package/@wroud/vite-plugin-playground

@wroud/vite-plugin-playground is a Vite plugin that creates a playground environment for your components and modules. It automatically discovers and loads story files, allowing you to showcase, test, and document your components in an interactive environment.

## Features

- **Automatic Story Discovery**: Finds and loads your story files based on configurable patterns
- **Documentation Support**: Markdown-based documentation with front matter
- **Component Playground**: Interactive environment for component development and testing
- **Hot Module Replacement**: Built-in HMR support for a seamless development experience
- [Pure ESM package][esm-info-url]

## Requirements

- React 19 or higher
- Vite 8 or higher
- `@wroud/vite-plugin-ssg` and `@tailwindcss/vite` in the same Vite config

## Installation

Install via npm:

```sh
npm install @wroud/vite-plugin-playground @wroud/playground-react @wroud/vite-plugin-ssg @tailwindcss/vite
```

Install via yarn:

```sh
yarn add @wroud/vite-plugin-playground @wroud/playground-react @wroud/vite-plugin-ssg @tailwindcss/vite
```

## Usage

Add the plugin next to `ssgPlugin()` and `tailwindcss()`:

```ts
// vite.config.ts
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { ssgPlugin } from "@wroud/vite-plugin-ssg";
import { playground } from "@wroud/vite-plugin-playground";

export default defineConfig({
  plugins: [
    playground({
      // Options
      imports: ["@wroud/react-components", "@my/component-library"],
    }),
    ssgPlugin(),
    tailwindcss(),
  ],
});
```

The playground is served at `<base>/playground/` next to your own app. `vite` serves it in development; `vite build` writes its pages to `<outDir>/playground/`.

### Options

- `path` (string): Location of the playground under Vite `base` (default: "playground")
- `imports` (string[]): Packages whose story and doc files are included as well. See [Stories from packages](#stories-from-packages)
- `stories` (string[]): Glob patterns for story files, relative to the Vite `root` (default: ["**/*.stories.{ts,tsx,js,jsx}"])
- `docs` (string[]): Glob patterns for documentation files, relative to the Vite `root` (default: ["**/*.stories.md", "../src/**/*.stories.md"])
- `exclude` (string[]): Glob patterns, relative to the Vite `root`, for files to leave out. Patterns in `stories` and `docs` can also start with `!` to leave files out

Story and doc files added or removed while `vite` is running appear without a restart.

### Stories from packages

A package listed in `imports` can be installed from npm or linked from a workspace. Its story and doc files are found with the `stories` and `docs` patterns, starting from the folder of the file its `"."` export points to. With the default patterns and `"exports": { ".": "./lib/index.js" }`, that means `lib/**/*.stories.{ts,tsx,js,jsx}`, `lib/**/*.stories.md` and `src/**/*.stories.md`.

The package needs to:

- publish its story files next to its entry, compiled to JavaScript, and include them in `files`
- list its story and doc files in `sideEffects` if it sets that field, or the production build drops them
- declare `@wroud/playground-react` as a peer dependency instead of bundling it

```json
{
  "name": "@my/component-library",
  "type": "module",
  "exports": { ".": "./lib/index.js" },
  "files": ["lib", "src/**/*.stories.md"],
  "sideEffects": ["./lib/**/*.stories.js", "./src/**/*.stories.md"],
  "peerDependencies": {
    "@wroud/playground-react": "^0.2.0",
    "react": "^19"
  }
}
```

### Creating Stories

Create story files that match your configured patterns:

```ts
// Button.stories.tsx
import { describe, story, Link } from "@wroud/playground-react";
import { Button } from "./Button";

describe("Button Component", () => {
  story(
    "Default",
    function DefaultButtonStory() {
      return <Button>Click Me</Button>;
    },
    { preview: true }
  );

  story(
    "Primary",
    function PrimaryButtonStory() {
      return <Button variant="primary">Primary Button</Button>;
    }
  );

  story(
    "With Preview and Description",
    function DetailedButtonStory() {
      return <Button disabled>Full Button Demo</Button>;
    },
    {
      preview: function PreviewButtonStory() {
        return <Button variant="primary">Preview</Button>;
      },
      description: "A complete button example with all available options"
    }
  );
});
```

### Controls

Give a story a `props` schema to get a controls panel next to it. Values from the panel are validated in the story and passed to the component as props. `states` adds named presets, and `useStoryPanel` adds action buttons and read-only values from inside the story.

```tsx
import { useState } from "react";
import { story, useStoryPanel } from "@wroud/playground-react";
import { z } from "zod";

story(
  "Counter",
  function CounterStory({ label, step }) {
    const [count, setCount] = useState(0);

    useStoryPanel({
      actions: { Increment: () => setCount((value) => value + step) },
      values: { Count: count },
    });

    return <Button>{`${label}: ${count}`}</Button>;
  },
  {
    props: z.object({
      label: z.string().default("Count"),
      step: z.int().min(1).max(10).default(1).meta({ control: "range" }),
    }),
    states: { large: { step: 10 } },
  },
);
```

See [`@wroud/playground-react`](../playground-react/README.md) for the supported schema libraries and how controls are chosen.

### Documentation

Create markdown files for documentation:

````md
---
title: Button Component
describe: "@my-components/button"
---

# Button Component

This component provides a customizable button with different variants.

## Usage

```jsx
import { Button } from "./Button";

<Button variant="primary">Click Me</Button>;
```
````

The `describe` field in the front matter specifies where to place the documentation in the navigation tree. For example, `"@my-components/button"` will place this documentation under the "@my-components" -> "button" path.

## Changelog

All notable changes to this project will be documented in the [CHANGELOG](./CHANGELOG.md) file.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
