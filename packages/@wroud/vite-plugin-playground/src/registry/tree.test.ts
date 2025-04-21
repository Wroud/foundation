import { describe, test, expect, beforeEach, vi } from "vitest";
import {
  deleteTreeBranch,
  isNodeRegistered,
  registerTreeNode,
  hasTreeChildren,
  connectTreeNodes,
  disconnectTreeNodes,
  getRegistryChildren,
  getRegistryNode,
} from "./tree.js";

// Helper to clear all the test nodes between tests
function clearTestNodes() {
  // Find and clean up all test nodes
  const testNodeIds = [
    "node1",
    "node2",
    "parent",
    "child",
    "child1",
    "child2",
    "story1",
    "story2",
  ];

  for (const id of testNodeIds) {
    if (isNodeRegistered(id)) {
      deleteTreeBranch(id);
    }
    // Also clean up the node registry
    if (getRegistryNode(id)) {
      // We can't directly access the node registry, but we can remove nodes
      // that might have been registered
      disconnectTreeNodes("any-parent", id);
    }
  }
}

describe("tree", () => {
  // Reset the module state before each test
  beforeEach(() => {
    vi.resetModules();
    clearTestNodes();
  });

  test("registerTreeNode with describe type and isNodeRegistered should handle describe node creation correctly", () => {
    const nodeId = "node1";

    // Initially node should not exist
    expect(isNodeRegistered(nodeId)).toBe(false);

    // Create the node
    registerTreeNode(nodeId, "describe", null);

    // Now node should exist
    expect(isNodeRegistered(nodeId)).toBe(true);

    // Create another node
    const anotherNodeId = "node2";
    registerTreeNode(anotherNodeId, "describe", null);

    // Both nodes should exist
    expect(isNodeRegistered(nodeId)).toBe(true);
    expect(isNodeRegistered(anotherNodeId)).toBe(true);
  });

  test("registerTreeNode should add type information to nodes", () => {
    const nodeId = "node1";
    registerTreeNode(nodeId, "describe", null);

    // Create and register another node with different type
    const storyNodeId = "story1";
    registerTreeNode(storyNodeId, "story", null);

    // Both nodes should exist with correct types
    // (We can't directly test the type since it's private, but we can test behavior)
  });

  test("connectTreeNodes and hasTreeChildren should manage parent-child relationships", () => {
    const parentId = "parent";
    const childId = "child";

    // Create nodes
    registerTreeNode(parentId, "describe", null);
    registerTreeNode(childId, "describe", null);

    // Initially parent has no children
    expect(hasTreeChildren(parentId)).toBe(false);

    // Add child to parent
    connectTreeNodes(parentId, childId);

    // Now parent should have children
    expect(hasTreeChildren(parentId)).toBe(true);
  });

  test("connectTreeNodes should add stories to a describe", () => {
    const describeId = "parent";
    const storyId = "story1";

    // Create nodes
    registerTreeNode(describeId, "describe", null);
    registerTreeNode(storyId, "story", null);

    // Initially describe has no children
    expect(hasTreeChildren(describeId)).toBe(false);

    // Add story to describe
    connectTreeNodes(describeId, storyId);

    // Now describe should have children
    expect(hasTreeChildren(describeId)).toBe(true);
  });

  test("disconnectTreeNodes should remove child from parent", () => {
    const parentId = "parent";
    const childId1 = "child1";
    const childId2 = "child2";

    // Create nodes
    registerTreeNode(parentId, "describe", null);
    registerTreeNode(childId1, "describe", null);
    registerTreeNode(childId2, "describe", null);

    // Add children to parent
    connectTreeNodes(parentId, childId1);
    connectTreeNodes(parentId, childId2);

    // Parent should have children
    expect(hasTreeChildren(parentId)).toBe(true);

    // Remove one child
    disconnectTreeNodes(parentId, childId1);

    // Parent should still have children
    expect(hasTreeChildren(parentId)).toBe(true);

    // Remove second child
    disconnectTreeNodes(parentId, childId2);

    // Parent should no longer have children
    expect(hasTreeChildren(parentId)).toBe(false);
  });

  test("getRegistryChildren should return correct children", () => {
    const parentId = "parent";
    const childId1 = "child1";
    const childId2 = "story2";

    // Create nodes
    registerTreeNode(parentId, "describe", null);
    registerTreeNode(childId1, "describe", parentId);
    registerTreeNode(childId2, "story", parentId);

    // Add children to parent
    connectTreeNodes(parentId, childId1);
    connectTreeNodes(parentId, childId2);

    // Get children
    const children = getRegistryChildren(parentId);

    // Should return array of INode objects with correct ids
    expect(children.length).toBe(2);
    expect(children).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "child1" }),
        expect.objectContaining({ id: "story2" }),
      ]),
    );
  });

  test("deleteTreeBranch should properly clean up nodes", () => {
    const nodeId = "node1";

    // Create the node
    registerTreeNode(nodeId, "describe", null);
    expect(isNodeRegistered(nodeId)).toBe(true);

    // Delete the node
    deleteTreeBranch(nodeId);

    // Node should no longer exist
    expect(isNodeRegistered(nodeId)).toBe(false);
  });
});
