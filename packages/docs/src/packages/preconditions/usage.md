---
outline: deep
---

# Usage

This example demonstrates how to define and fulfill preconditions for an entity.

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

const nodePreconditionManager = new PreconditionManager<Node>();
nodePreconditionManager.register(new DatabaseConnectionPrecondition());

const node: Node = {
  id: "node1",
  data: { requiresDatabaseConnection: true },
};

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
