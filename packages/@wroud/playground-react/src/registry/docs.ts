import type { IDoc } from "../IDoc.js";
import {
  registerUnsubscribe,
  executeInTransaction,
  type UnsubscribeFn,
} from "./listeners.js";
import * as tree from "./tree.js";
import { registerDescribe } from "./describes.js";

// Private story storage
const docs = new Map<string, IDoc<any>>();

// Private accessor functions
function getDocById(id: string): IDoc | undefined {
  return docs.get(id);
}

function getAllDocsArray(): IDoc[] {
  return [...docs.values()];
}

function setDoc<T>(id: string, doc: IDoc<T>): void {
  docs.set(id, doc);
}

function removeDoc(id: string): void {
  docs.delete(id);
}

/**
 * Register a story in the registry
 */
export function registerDoc<T>(doc: IDoc<T>): UnsubscribeFn {
  return executeInTransaction(() => {
    // Register story
    setDoc(doc.id, doc);
    tree.registerTreeNode(doc.id, "doc", doc.describe.id);

    // Ensure describe exists and link story to it
    const deleteDescribe = registerDescribe(doc.describe);
    tree.connectTreeNodes(doc.describe.id, doc.id);

    const unsubscribe = () =>
      executeInTransaction(() => {
        removeDoc(doc.id);
        tree.unregisterTreeNode(doc.id);
        tree.disconnectTreeNodes(doc.describe.id, doc.id);
        deleteDescribe();
      });

    registerUnsubscribe(unsubscribe);
    return unsubscribe;
  });
}

/**
 * Fetch a story by ID
 */
export function fetchDocById(id: string): IDoc | undefined {
  return getDocById(id);
}

/**
 * Fetch all stories from the registry
 */
export function fetchAllDocs(): IDoc[] {
  return getAllDocsArray();
}

/**
 * Fetch stories belonging to a specific describe
 */
export function fetchDocsForDescribe(describeId: string): IDoc[] {
  return tree
    .getRegistryChildren(describeId)
    .filter((node) => node.type === "doc")
    .map((node) => getDocById(node.id)!)
    .filter(Boolean);
}
