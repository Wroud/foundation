import type { IDescribe } from "../IDescribe.js";
import {
  registerUnsubscribe,
  executeInTransaction,
  type UnsubscribeFn,
} from "./listeners.js";
import * as tree from "./tree.js";

// Private describe storage
const describes = new Map<string, IDescribe>();

// Private accessor functions
function getDescribeById(id: string): IDescribe | undefined {
  return describes.get(id);
}

function setDescribe(id: string, describe: IDescribe): void {
  describes.set(id, describe);
}

function removeDescribe(id: string): void {
  describes.delete(id);
}

/**
 * Register a describe component in the registry
 */
export function registerDescribe(describe: IDescribe): UnsubscribeFn {
  return executeInTransaction(() => {
    // Add parent hierarchy recursively
    registerParentChain(describe);

    // Register describe if not already in tree
    if (!tree.isNodeRegistered(describe.id)) {
      tree.registerTreeNode(
        describe.id,
        "describe",
        describe.parent?.id ?? null,
      );
    }

    setDescribe(describe.id, describe);

    // Link to parent
    if (describe.parent) {
      tree.connectTreeNodes(describe.parent.id, describe.id);
    }

    const unsubscribe = () => deleteDescribeIfEmpty(describe);
    registerUnsubscribe(unsubscribe);
    return unsubscribe;
  });
}

// Helper for parent chain
function registerParentChain(describe: IDescribe): void {
  let parent = describe.parent;
  while (parent) {
    registerDescribe(parent);
    parent = parent.parent;
  }
}

// Private function to delete empty describes
function deleteDescribeIfEmpty(describe: IDescribe): void {
  executeInTransaction(() => {
    if (tree.hasTreeChildren(describe.id)) return;

    // Clean up maps
    removeDescribe(describe.id);
    tree.unregisterTreeNode(describe.id);
    tree.deleteTreeBranch(describe.id);

    // Clean up parent relation
    if (describe.parent) {
      tree.disconnectTreeNodes(describe.parent.id, describe.id);
      deleteDescribeIfEmpty(describe.parent);
    }
  });
}

/**
 * Get child describes for a parent
 */
export function fetchChildDescribes(parentId: string): IDescribe[] {
  return tree
    .getRegistryChildren(parentId)
    .filter((node) => node.type === "describe")
    .map((node) => getDescribeById(node.id)!)
    .filter(Boolean);
}

export function fetchDescribeById(id: string): IDescribe | undefined {
  return getDescribeById(id);
}
