# graphql-codegen-fragment-masking

[![ESM-only package][package]][esm-info-url]  
[![NPM version][npm]][npm-url]

<!-- [![Install size][size]][size-url] -->

[package]: https://img.shields.io/badge/package-ESM--only-ffe536.svg
[esm-info-url]: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c
[npm]: https://img.shields.io/npm/v/graphql-codegen-fragment-masking.svg
[npm-url]: https://npmjs.com/package/graphql-codegen-fragment-masking
[size]: https://packagephobia.com/badge?p=graphql-codegen-fragment-masking
[size-url]: https://packagephobia.com/result?p=graphql-codegen-fragment-masking

`graphql-codegen-fragment-masking` is a custom plugin for GraphQL Code Generator that generates fragment masking helper functions for TypeScript. It enhances type safety by providing utility functions to manage GraphQL fragments, ensuring robust and maintainable client-side code.

## Features

- **Fragment Type Helpers:** Automatically generates type-safe fragment helpers.
- **Unmask Functions:** Provides customizable unmask functions for fragment data handling.
- **Fragment Readiness Checks:** Includes functions to verify if fragments are ready based on query data.
- **Enhanced Type Safety:** Ensures robust TypeScript types for GraphQL fragments.
- **Customizable Configuration:** Easily adaptable to various project configurations and document modes.
- **Seamless Integration:** Integrates smoothly with existing GraphQL Code Generator setups.
- [Pure ESM package][esm-info-url]

## Installation

Install via npm:

```sh
npm install -D graphql-codegen-fragment-masking
```

Install via yarn:

```sh
yarn add -D graphql-codegen-fragment-masking
```

## Usage

Configure `graphql-codegen-fragment-masking` in your `codegen.ts` file to generate fragment masking helpers alongside your TypeScript types.

### Example Configuration

```ts
import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  pluginLoader: (name) => import(name),
  schema: "./src/schema.graphql",
  documents: "./src/**/*.graphql",
  generates: {
    "./src/generated/fragment-masking.ts": {
      plugins: ["fragment-masking"],
      config: {
        importIncrementalFrom: "./common-types",
        unmaskFunctionName: "getFragmentData",
        useTypeImports: true,
      },
    },
    "./src/generated/common-types.ts": {
      plugins: ["typescript"],
      config: {
        avoidOptionals: true,
      },
    },
  },
};

export default config;
```

### Generated Helpers

The plugin will generate helper functions such as `FragmentType`, `makeFragmentData`, and `getFragmentData` based on your configuration. These helpers facilitate type-safe fragment management in your TypeScript code.

### Example Usage

Given a GraphQL fragment:

```graphql
fragment UserFragment on User {
  id
  name
}
```

And a corresponding TypeScript type:

```ts
import { FragmentType, getFragmentData } from "./generated/fragment-masking";
import { UserFragment } from "./generated/graphql";

const userData: FragmentType<typeof UserFragment> = {
  id: "1",
  name: "John Doe",
};

const user = getFragmentData(UserFragment, userData);
```

This setup ensures that `user` is correctly typed, enhancing type safety and reducing potential runtime errors.

## Configuration Options

- **importIncrementalFrom** (`string`): Specifies the module to import incremental types from. Default is `"./graphql"`.

## FAQ

### **Error: Unable to load template plugin matching 'fragment-masking'**

```text
Unable to load template plugin matching 'fragment-masking'.
Reason:
require() of ES Module graphql-codegen-fragment-masking/out/index.js is not supported.
Instead change the require of index.js in ...
```

**Solution:**  
This error occurs because `@graphql-codegen` expects the plugin to be loaded in a specific way. To resolve this, ensure you have a `pluginLoader` function in your GraphQL Code Generator configuration:

```ts
import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  // ... other configurations
  pluginLoader: (name) => import(name),
  // ... other configurations
};

export default config;
```

This ensures the plugin is loaded as an ES module, preventing the `require()` error.

## Changelog

All notable changes to this project will be documented in the [CHANGELOG](./CHANGELOG.md) file.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.

---

**Note:** Ensure that your project setup aligns with the plugin's requirements, especially regarding TypeScript configurations and GraphQL Code Generator versions.
