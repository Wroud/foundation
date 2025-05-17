---
outline: deep
---

# Preconditions

`@wroud/preconditions` is a flexible library for defining and managing preconditions for your entities. It helps you validate and prepare data by registering preconditions that can be checked or fulfilled dynamically.

## Key Features

- **Entity-Specific Managers**: Manage preconditions for different entity types independently.
- **Dynamic Applicability**: Apply preconditions only when they are relevant to the current entity.
- **Extensibility**: Register additional preconditions in a plugin-style manner.
- **Check and Fulfill**: Validate preconditions or attempt to fulfill them automatically.
- **TypeScript Support**: Written in TypeScript for strong typing.
- **Pure ESM** package.

## Basic Usage

```ts
import { PreconditionManager, type IPrecondition } from "@wroud/preconditions";

interface Node {
  id: string;
  data: { requiresDatabaseConnection?: boolean };
}

class DatabaseConnectionPrecondition implements IPrecondition<Node> {
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

const manager = new PreconditionManager<Node>();
manager.register(new DatabaseConnectionPrecondition());
```
