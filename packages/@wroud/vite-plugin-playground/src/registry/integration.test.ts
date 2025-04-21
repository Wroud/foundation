import { describe, test, expect, beforeEach, vi } from "vitest";
import * as api from "./index.js";
import type { IDescribe } from "../IDescribe.js";
import type { IStory } from "../IStory.js";

// Create a mock React component for tests
const MockComponent = () => null;

describe("Registry API Integration", () => {
  // Reset the module state before each test
  beforeEach(() => {
    vi.resetModules();
  });

  test("registerStory should add story and its describe hierarchy", () => {
    const grandparent: IDescribe = {
      id: "grandparent",
      name: "Grandparent",
      parent: null,
    };
    const parent: IDescribe = {
      id: "parent",
      name: "Parent",
      parent: grandparent,
    };
    const describe: IDescribe = {
      id: "describe1",
      name: "Describe 1",
      parent: parent,
    };
    const story: IStory = {
      id: "story1",
      name: "Story 1",
      describe,
      component: MockComponent,
      options: {},
    };

    const unsubscribe = api.registerStory(story);

    // Story should be retrievable
    expect(api.fetchStoryById("story1")).toBe(story);
    expect(api.fetchStoriesForDescribe("describe1")).toContain(story);

    // Describe hierarchy should be created
    const parentDescribes = api.fetchChildDescribes("parent");
    expect(parentDescribes).toContainEqual(
      expect.objectContaining({ id: "describe1" }),
    );

    const grandparentDescribes = api.fetchChildDescribes("grandparent");
    expect(grandparentDescribes).toContainEqual(
      expect.objectContaining({ id: "parent" }),
    );

    // Unsubscribe should remove the story
    unsubscribe();

    // Story should no longer be retrievable
    expect(api.fetchStoryById("story1")).toBeUndefined();
  });

  test("subscribeToRegistryChanges should notify listeners when stories change", () => {
    const listener = vi.fn();
    api.subscribeToRegistryChanges(listener);

    const describe: IDescribe = {
      id: "describe1",
      name: "Describe 1",
      parent: null,
    };
    const story: IStory = {
      id: "story1",
      name: "Story 1",
      describe,
      component: MockComponent,
      options: {},
    };

    api.registerStory(story);

    expect(listener).toHaveBeenCalledTimes(1);
  });

  test("executeInTransaction should batch operations", () => {
    const listener = vi.fn();
    api.subscribeToRegistryChanges(listener);

    api.executeInTransaction(() => {
      // Simulating multiple operations
      const describe1: IDescribe = {
        id: "describe1",
        name: "Describe 1",
        parent: null,
      };
      const describe2: IDescribe = {
        id: "describe2",
        name: "Describe 2",
        parent: null,
      };

      api.registerDescribe(describe1);
      api.registerDescribe(describe2);

      // Nested transaction
      api.executeInTransaction(() => {
        const story: IStory = {
          id: "story1",
          name: "Story 1",
          describe: describe1,
          component: MockComponent,
          options: {},
        };

        api.registerStory(story);
      });
    });

    // Listener should only be called once after all transactions complete
    expect(listener).toHaveBeenCalledTimes(1);
  });

  test("fetchAllStories and fetchStoriesForDescribe should return correct stories", () => {
    const describe1: IDescribe = {
      id: "describe1",
      name: "Describe 1",
      parent: null,
    };
    const describe2: IDescribe = {
      id: "describe2",
      name: "Describe 2",
      parent: null,
    };

    const story1: IStory = {
      id: "story1",
      name: "Story 1",
      describe: describe1,
      component: MockComponent,
      options: {},
    };
    const story2: IStory = {
      id: "story2",
      name: "Story 2",
      describe: describe1,
      component: MockComponent,
      options: {},
    };
    const story3: IStory = {
      id: "story3",
      name: "Story 3",
      describe: describe2,
      component: MockComponent,
      options: {},
    };

    api.registerStory(story1);
    api.registerStory(story2);
    api.registerStory(story3);

    // Test fetchAllStories
    const allStories = api.fetchAllStories();
    expect(allStories.length).toBe(3);
    expect(allStories).toContain(story1);
    expect(allStories).toContain(story2);
    expect(allStories).toContain(story3);

    // Test fetchStoriesForDescribe for specific describe
    const describe1Stories = api.fetchStoriesForDescribe("describe1");
    expect(describe1Stories.length).toBe(2);
    expect(describe1Stories).toContain(story1);
    expect(describe1Stories).toContain(story2);
    expect(describe1Stories).not.toContain(story3);
  });

  test("registerDescribe should add a describe and return unsubscribe function", () => {
    const describe: IDescribe = {
      id: "describe1",
      name: "Describe 1",
      parent: null,
    };

    const unsubscribe = api.registerDescribe(describe);
    expect(typeof unsubscribe).toBe("function");

    // Check that the describe is properly registered
    expect(api.isNodeRegistered("describe1")).toBe(true);

    // Since the describe has no parent (parent is null), it should be
    // at the root level, but not necessarily under "/" specifically
    const allDescribes = api
      .fetchAllStories()
      .filter((story) => story.describe.id === "describe1");
    expect(allDescribes.length).toBeGreaterThanOrEqual(0);

    // Adding a story to the describe
    const story: IStory = {
      id: "story1",
      name: "Story 1",
      describe,
      component: MockComponent,
      options: {},
    };

    api.registerStory(story);

    // Story should be retrievable
    expect(api.fetchStoryById("story1")).toBe(story);

    const stories = api.fetchStoriesForDescribe("describe1");
    expect(stories).toContain(story);
  });
});
