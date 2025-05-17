---
outline: deep
---

# Asset Resolver Plugin

`@wroud/vite-plugin-asset-resolver` is a Vite plugin that remaps asset imports from `dist` directories to `src` directories. This helps maintain cleaner imports when your project structure separates compiled files from source files.

## Features

- **Custom Asset Resolution**: Resolve images, SVGs, and other assets from `src` instead of `dist`.
- **Multiple Aliases**: Define multiple `src` and `dist` directories.
- **Custom Extensions**: Specify which file extensions to resolve.
