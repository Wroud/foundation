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

## Installation

Install via npm:

```sh
npm install @wroud/vite-plugin-playground
```

Install via yarn:

```sh
yarn add @wroud/vite-plugin-playground
```

## Usage

Add the plugin to your Vite configuration:

```ts
// vite.config.ts
import { defineConfig } from "vite";
import { playground } from "@wroud/vite-plugin-playground/plugin";

export default defineConfig({
  plugins: [
    playground({
      // Options
      imports: ["@wroud/react-components", "@my/component-library"],
      bundle: true,
    }),
  ],
});
```

### Options

- `path` (string): Playground base path (default: "playground")
- `imports` (string[]): Additional modules to import in the playground
- `stories` (string[]): Glob patterns for story files (default: ["**/*.stories.{ts,tsx,js,jsx}"])
- `docs` (string[]): Glob patterns for documentation files (default: ["**/*.stories.md", "../src/**/*.stories.md"])
- `exclude` (string[]): Glob patterns for files to exclude
- `bundle` (boolean): Whether to bundle the playground (default: false)

### Creating Stories

Create story files that match your configured patterns:

```ts
// Button.stories.tsx
import { describe, story, Link } from "@wroud/vite-plugin-playground";
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

### Documentation

Create markdown files for documentation:

```md
---
title: Button Component
describe: "@my-components/button"
---

# Button Component

This component provides a customizable button with different variants.

## Usage

```jsx
import { Button } from './Button';

<Button variant="primary">Click Me</Button>
```
```

The `describe` field in the front matter specifies where to place the documentation in the navigation tree. For example, `"@my-components/button"` will place this documentation under the "@my-components" -> "button" path.

## Changelog

All notable changes to this project will be documented in the [CHANGELOG](./CHANGELOG.md) file.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
