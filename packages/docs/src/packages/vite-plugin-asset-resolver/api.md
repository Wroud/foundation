---
outline: deep
---

# API

## `assetResolverPlugin(options?: IResolveAssetsOptions)`

Creates the Vite plugin instance.

### Options

- **`dist`** – array of compiled asset directories. Defaults to `["dist", "lib", "build", "out", "output"]`.
- **`src`** – array of source directories. Defaults to `["src", "source", "app", "assets"]`.
- **`extensions`** – array of file extensions to resolve. Defaults to a set of common asset extensions.

### Constants

The package also exports `DEFAULT_DIST`, `DEFAULT_SRC`, and `KNOWN_ASSET_TYPES`.
