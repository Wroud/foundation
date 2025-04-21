export interface INode {
  type: "describe" | "story" | "doc";
  id: string;
  parent: string | null;
}

// Private storage
const nodes = new Map<string, INode>();
const tree = new Map<string, Set<string>>();

/**
 * Get children nodes for a parent
 */
export function getRegistryChildren(parentId: string): INode[] {
  const nodeIds = tree.get(parentId) || new Set();
  return [...nodeIds]
    .map((id) => nodes.get(id))
    .filter((node): node is INode => node !== undefined);
}

/**
 * Get a node by ID
 */
export function getRegistryNode(id: string): INode | undefined {
  return nodes.get(id);
}

/**
 * Add a node to the registry
 */
export function registerTreeNode(
  id: string,
  type: "describe" | "story" | "doc",
  parent: string | null,
): void {
  nodes.set(id, { type, id, parent });

  // Only describes can have children
  if (type === "describe" && !tree.has(id)) {
    tree.set(id, new Set<string>());
  }
}

/**
 * Link a child node to a parent
 */
export function connectTreeNodes(parentId: string, childId: string): void {
  let children = tree.get(parentId);
  if (!children) {
    children = new Set();
    tree.set(parentId, children);
  }
  children.add(childId);
}

/**
 * Remove a node from the registry
 */
export function unregisterTreeNode(id: string): void {
  nodes.delete(id);
}

/**
 * Unlink a child from its parent
 */
export function disconnectTreeNodes(parentId: string, childId: string): void {
  const children = tree.get(parentId);
  if (children) {
    children.delete(childId);
  }
}

/**
 * Remove a parent node from the tree
 */
export function deleteTreeBranch(id: string): void {
  tree.delete(id);
}

/**
 * Check if a node has any children
 */
export function hasTreeChildren(nodeId: string): boolean {
  const children = tree.get(nodeId);
  return Boolean(children && children.size > 0);
}

/**
 * Check if a node exists in the tree
 */
export function isNodeRegistered(id: string): boolean {
  return tree.has(id);
}
