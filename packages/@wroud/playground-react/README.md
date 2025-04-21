# @wroud/playground-react

[![ESM-only package][package]][esm-info-url]
[![NPM version][npm]][npm-url]

[package]: https://img.shields.io/badge/package-ESM--only-ffe536.svg
[esm-info-url]: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c
[npm]: https://img.shields.io/npm/v/@wroud/playground-react.svg
[npm-url]: https://npmjs.com/package/@wroud/playground-react

@wroud/playground-react is a React library for creating component stories and demos. It provides a simple API to describe and showcase React components, designed to work with the @wroud/vite-plugin-playground ecosystem.

## Features

- **Component Showcasing**: Easily create interactive examples of your React components
- **Nested Descriptions**: Organize your components into logical groups
- **Preview Support**: Create compact previews for components in navigation
- **TypeScript**: Written in TypeScript for type safety
- [Pure ESM package][esm-info-url]

## Installation

Install via npm:

```sh
npm install @wroud/playground-react
```

Install via yarn

```sh
yarn add @wroud/playground-react
```

## Documentation

For detailed usage and API reference, visit the [documentation site](https://wroud.dev).

## Example

```tsx
import { describe, story } from "@wroud/playground-react";
import { Button } from "./Button";

describe("Buttons", () => {
  story(
    "Default",
    function DefaultButtonStory() {
      return <Button>Click Me</Button>;
    }
  );
  
  story(
    "Primary",
    function PrimaryButtonStory() {
      return <Button variant="primary">Primary Button</Button>;
    },
    {
      preview: true,
      description: "A primary button with higher visual prominence"
    }
  );
});
```

## API Reference

### describe(name, callback)

Creates a group of related stories.

- `name`: The name of the group
- `callback`: A function containing story definitions

### story(name, component, options?)

Defines a component story.

- `name`: The name of the story
- `component`: React component rendering the story
- `options`: Optional configuration
  - `preview`: Component for preview or `true` to use the main component
  - `description`: Short description of the story

## Changelog

All notable changes to this project will be documented in the [CHANGELOG](./CHANGELOG.md) file.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
