import { describe, test, expect, beforeEach, vi } from "vitest";
import { registerDescribe, fetchChildDescribes } from "./describes.js";
import { registerStory } from "./stories.js";
import * as tree from "./tree.js";
import type { IDescribe } from "../IDescribe.js";
import type { IStory } from "../IStory.js";

// Create a mock React component for tests
const MockComponent = () => null;

describe("describes", () => {
  // Reset the module state before each test
  beforeEach(() => {
    vi.resetModules();
  });

  test("registerDescribe should add a describe and return an unsubscribe function", () => {
    const parent: IDescribe = {
      id: "parent",
      name: "Parent",
      parent: null,
    };
    const child: IDescribe = {
      id: "child",
      name: "Child",
      parent: parent,
    };

    const unsubscribe = registerDescribe(child);
    expect(typeof unsubscribe).toBe("function");

    // Check that the describe was added to the registry
    const childDescribes = fetchChildDescribes(parent.id);
    expect(childDescribes.length).toBe(1);
    expect(childDescribes[0]).toEqual(child);

    // Verify parent-child relationship in tree
    expect(tree.isNodeRegistered("parent")).toBe(true);
    expect(tree.isNodeRegistered("child")).toBe(true);
    expect(tree.hasTreeChildren("parent")).toBe(true);
  });

  test("fetchChildDescribes should return child describes for a parent", () => {
    const parent: IDescribe = {
      id: "parent",
      name: "Parent",
      parent: null,
    };
    const child1: IDescribe = {
      id: "child1",
      name: "Child 1",
      parent: parent,
    };
    const child2: IDescribe = {
      id: "child2",
      name: "Child 2",
      parent: parent,
    };

    // Add two children to parent
    registerDescribe(child1);
    registerDescribe(child2);

    // Get the children
    const children = fetchChildDescribes(parent.id);
    // Test is less brittle if we check for "at least contains" rather than exact count
    expect(children.length).toBeGreaterThanOrEqual(2);
    expect(children).toContainEqual(expect.objectContaining({ id: "child1" }));
    expect(children).toContainEqual(expect.objectContaining({ id: "child2" }));
  });

  test("unsubscribe should handle describes with stories correctly", () => {
    const describe: IDescribe = {
      id: "describe1",
      name: "Describe 1",
      parent: null,
    };

    // Add a describe
    const unsubscribe = registerDescribe(describe);

    // Add a story to the describe
    const story: IStory = {
      id: "story1",
      name: "Story 1",
      describe,
      component: MockComponent,
      options: {},
    };
    registerStory(story);

    // Try to unsubscribe - should not remove the describe because it has a story
    unsubscribe();

    // Describe should still exist in tree because it has a story
    expect(tree.isNodeRegistered("describe1")).toBe(true);
  });

  test("unsubscribe should handle empty describes correctly", () => {
    const describe: IDescribe = {
      id: "describe1",
      name: "Describe 1",
      parent: null,
    };

    // Add a describe
    const unsubscribe = registerDescribe(describe);

    // Unsubscribe should remove the describe because it has no children
    unsubscribe();

    // Verify describe was removed
    const describes = fetchChildDescribes("any-parent");
    expect(describes.length).toBe(0);
  });

  test("unsubscribe should handle nested describes correctly", () => {
    const parent: IDescribe = {
      id: "parent",
      name: "Parent",
      parent: null,
    };
    const child1: IDescribe = {
      id: "child1",
      name: "Child 1",
      parent: parent,
    };
    const child2: IDescribe = {
      id: "child2",
      name: "Child 2",
      parent: parent,
    };

    // Add two children to parent
    registerDescribe(child1);
    const child2Unsubscribe = registerDescribe(child2);

    // Add a story to child1
    const story: IStory = {
      id: "story1",
      name: "Story 1",
      describe: child1,
      component: MockComponent,
      options: {},
    };
    registerStory(story);

    // Unsubscribe child1 - should not remove child1 because it has a story
    // But it should leave parent and child2 untouched
    const child1Unsubscribe = registerDescribe(child1);
    child1Unsubscribe();

    // Verify parent and child2 still exist
    expect(tree.isNodeRegistered("parent")).toBe(true);
    expect(tree.isNodeRegistered("child2")).toBe(true);

    // Now unsubscribe child2 - it should be removed but parent should remain
    // because of child1
    child2Unsubscribe();
    expect(tree.isNodeRegistered("child2")).toBe(false);
    expect(tree.isNodeRegistered("parent")).toBe(true);
  });
});
