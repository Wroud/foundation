# graphql-codegen-typed-document-nodes

[![ESM-only package][package]][esm-info-url]  
[![NPM version][npm]][npm-url]

<!-- [![Install size][size]][size-url] -->

[package]: https://img.shields.io/badge/package-ESM--only-ffe536.svg
[esm-info-url]: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c
[npm]: https://img.shields.io/npm/v/graphql-codegen-typed-document-nodes.svg
[npm-url]: https://npmjs.com/package/graphql-codegen-typed-document-nodes
[size]: https://packagephobia.com/badge?p=graphql-codegen-typed-document-nodes
[size-url]: https://packagephobia.com/result?p=graphql-codegen-typed-document-nodes

`graphql-codegen-typed-document-nodes` is a custom plugin for GraphQL Code Generator that generates typed document nodes for TypeScript operations and fragments. It enhances type safety by providing exportable types for GraphQL queries, mutations, and fragments.

## Features

- **TypedDocumentNode generation**: Automatically generates typed document nodes for operations and fragments.
- **Type-safe GraphQL operations**: Ensures queries, mutations, and fragments have precise TypeScript types.
- **Seamless integration**: Works as a plugin for GraphQL Code Generator.
- [Pure ESM package][esm-info-url]

## Installation

This plugin requires the `@graphql-codegen/typescript-operations` plugin to function correctly.

Install via npm:

```sh
npm install -D graphql-codegen-typed-document-nodes @graphql-codegen/typescript-operations
```

Install via yarn:

```sh
yarn add -D graphql-codegen-typed-document-nodes @graphql-codegen/typescript-operations
```

## Usage

This configuration will generate `*.generated.{ts,tsx}` files for each `.ts` or `.tsx` file containing operations or fragments.  
Here’s an example configuration using `graphql-codegen-typed-document-nodes` in a `codegen.ts` file:

```ts
import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  pluginLoader: (name) => import(name),
  schema: "schema.graphql",
  documents: "src/**/*.graphql",
  ignoreNoDocuments: true,
  generates: {
    "./src/generated/common-types.ts": {
      plugins: ["typescript"],
      config: {
        avoidOptionals: true,
      },
    },
    ".": {
      preset: "near-operation-file",
      plugins: ["typescript-operations", "typed-document-nodes"],
      presetConfig: {
        baseTypesPath: "./src/generated/common-types.ts",
      },
      config: {
        inlineFragmentTypes: "mask",
      },
    },
  },
};

export default config;
```

### Example Query

Given the following query:

```ts
const getUserQuery = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      name
    }
  }
`;
```

This plugin will generate the following type:

```ts
...
export type GetUserDocument = Types.TypedDocumentNode<GetUserQuery, GetUserQueryVariables>;
```

You can now use the generated type in your application:

```ts
import { GetUserDocument } from "./getUserQuery.generated.ts";

const getUserQuery: GetUserDocument = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      name
    }
  }
`;
```

## FAQ

### **Error: Unable to load template plugin matching 'typed-document-nodes'**

```text
Unable to load template plugin matching 'typed-document-nodes'.
Reason:
require() of ES Module graphql-codegen-typed-document-nodes/out/index.js fr…
Instead change the require of index.js in .yarn/__virtual__/@graphql-codegen-cli-vir…
```

**Solution:**  
This error occurs because `@graphql-codegen` expects the plugin to be loaded in a specific way. To resolve this, add a `pluginLoader` function to your GraphQL Code Generator configuration:

```ts
import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  ...
  pluginLoader: (name) => import(name),
  ...
};

export default config;
```

This ensures the plugin is loaded as an ES module, preventing the `require()` error.

## Changelog

All notable changes to this project will be documented in the [CHANGELOG](./CHANGELOG.md) file.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
