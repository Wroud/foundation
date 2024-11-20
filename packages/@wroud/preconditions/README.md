# @wroud/preconditions

[![ESM-only package][package]][esm-info-url]
[![NPM version][npm]][npm-url]

<!-- [![Install size][size]][size-url] -->

[package]: https://img.shields.io/badge/package-ESM--only-ffe536.svg
[esm-info-url]: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c
[npm]: https://img.shields.io/npm/v/@wroud/preconditions.svg
[npm-url]: https://npmjs.com/package/@wroud/preconditions
[size]: https://packagephobia.com/badge?p=@wroud/preconditions
[size-url]: https://packagephobia.com/result?p=@wroud/preconditions

@wroud/preconditions is a flexible and extensible library for managing preconditions in JavaScript and TypeScript applications. It simplifies the process of validating and preparing entities (e.g., nodes, connections, features) by providing a robust framework for defining and applying preconditions.

## Features

- **Entity-Specific Managers**: Manage preconditions independently for different types of entities.
- **Dynamic Applicability**: Apply preconditions selectively to specific instances based on their data.
- **Extensibility**: Add new preconditions dynamically in a plugin-style manner.
- **Check-Only and Fulfill Modes**: Support both validating preconditions and attempting to fulfill them.
- **TypeScript Support**: Provides strong typing for enhanced developer experience.
- [Pure ESM package][esm-info-url]

## Installation

Install via npm:

```sh
npm install @wroud/preconditions
```

Install via yarn:

```sh
yarn add @wroud/preconditions
```

## Documentation

For detailed usage and API reference, visit the [documentation site](https://wroud.dev).

## Example

### Define Your Entities

```ts
export interface Node {
  id: string;
  data: {
    requiresDatabaseConnection?: boolean;
  };
}
```

### Define Preconditions

```ts
import type { IPrecondition } from "@wroud/preconditions";

export class DatabaseConnectionPrecondition implements IPrecondition<Node> {
  isApplicable(node: Node): boolean {
    return node.data.requiresDatabaseConnection === true;
  }

  async check(node: Node): Promise<boolean> {
    return databaseConnection.isEstablished();
  }

  async fulfill(node: Node): Promise<void> {
    await databaseConnection.connect();
  }
}
```

### Set Up a Precondition Manager

```ts
import { PreconditionManager } from "@wroud/preconditions";
import { Node } from "./Node";
import { DatabaseConnectionPrecondition } from "./NodePreconditions";

const nodePreconditionManager = new PreconditionManager<Node>();
nodePreconditionManager.register(new DatabaseConnectionPrecondition());
```

### Check and Fulfill Preconditions

```ts
const node: Node = { id: "node1", data: { requiresDatabaseConnection: true } };

const canLoad = await nodePreconditionManager.checkPreconditions(node);

if (canLoad) {
  console.log("Node can be loaded.");
} else {
  try {
    await nodePreconditionManager.fulfillPreconditions(node);
    console.log("Preconditions fulfilled. Node is ready to load.");
  } catch (error) {
    console.error("Failed to fulfill preconditions:", error);
  }
}
```

## Changelog

All notable changes to this project will be documented in the [CHANGELOG](./CHANGELOG.md) file.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
