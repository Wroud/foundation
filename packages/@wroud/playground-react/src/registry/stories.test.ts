import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import {
  registerStory,
  fetchStoryById,
  fetchAllStories,
  fetchStoriesForDescribe,
} from "./stories.js";
import { registerDescribe } from "./describes.js";
import * as tree from "./tree.js";
import type { IDescribe } from "../IDescribe.js";
import type { IStory } from "../IStory.js";

// Create a mock React component for tests
const MockComponent = () => null;

function clearTestRegistries() {
  // Clear any test data
  const testIds = ["describe1", "describe2", "story1", "story2", "story3"];
  testIds.forEach((id) => {
    if (tree.isNodeRegistered(id)) {
      tree.unregisterTreeNode(id);
    }
  });
}

describe("stories", () => {
  // Reset the module state before each test
  beforeEach(() => {
    vi.resetModules();
    clearTestRegistries();
  });

  afterEach(() => {
    clearTestRegistries();
  });

  test("registerStory should add a story and return unsubscribe function", () => {
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

    const unsubscribe = registerStory(story);
    expect(typeof unsubscribe).toBe("function");

    // Story should be retrievable
    const retrievedStory = fetchStoryById("story1");
    expect(retrievedStory).toBe(story);
  });

  test("fetchStoryById should return a story by ID", () => {
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

    registerStory(story);

    const retrievedStory = fetchStoryById("story1");
    expect(retrievedStory).toBe(story);

    const nonExistentStory = fetchStoryById("nonexistent");
    expect(nonExistentStory).toBeUndefined();
  });

  test("fetchAllStories should return all stories", () => {
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
      describe: describe2,
      component: MockComponent,
      options: {},
    };

    registerStory(story1);
    registerStory(story2);

    const allStories = fetchAllStories();
    expect(allStories.length).toBe(2);
    expect(allStories).toContain(story1);
    expect(allStories).toContain(story2);
  });

  test("fetchStoriesForDescribe should return stories for a specific describe", () => {
    // Create describes
    const describe1: IDescribe = {
      id: "test-describe1",
      name: "Test Describe 1",
      parent: null,
    };

    const describe2: IDescribe = {
      id: "test-describe2",
      name: "Test Describe 2",
      parent: null,
    };

    // Create stories with different IDs to avoid any collision
    const story1: IStory = {
      id: "test-story1",
      name: "Test Story 1",
      describe: describe1,
      component: MockComponent,
      options: {},
    };

    const story2: IStory = {
      id: "test-story2",
      name: "Test Story 2",
      describe: describe1,
      component: MockComponent,
      options: {},
    };

    const story3: IStory = {
      id: "test-story3",
      name: "Test Story 3",
      describe: describe2,
      component: MockComponent,
      options: {},
    };

    // Register stories
    const unsubscribe1 = registerStory(story1);
    const unsubscribe2 = registerStory(story2);
    const unsubscribe3 = registerStory(story3);

    // Check stories for describe1
    const stories1 = fetchStoriesForDescribe("test-describe1");
    expect(stories1).toHaveLength(2);
    expect(stories1[0]?.id).toBe("test-story1");
    expect(stories1[1]?.id).toBe("test-story2");

    // Check stories for describe2
    const stories2 = fetchStoriesForDescribe("test-describe2");
    expect(stories2).toHaveLength(1);
    expect(stories2[0]?.id).toBe("test-story3");

    // Clean up
    unsubscribe1();
    unsubscribe2();
    unsubscribe3();
  });

  test("unsubscribe should remove the story", () => {
    const describe: IDescribe = {
      id: "describe1",
      name: "Describe 1",
      parent: null,
    };

    // First register a describe directly to ensure it's not removed
    registerDescribe(describe);

    const story: IStory = {
      id: "story1",
      name: "Story 1",
      describe,
      component: MockComponent,
      options: {},
    };

    const unsubscribe = registerStory(story);

    // Verify the story exists
    expect(fetchStoryById("story1")).toBe(story);

    // Unsubscribe should remove the story
    unsubscribe();

    // Story should no longer be retrievable
    expect(fetchStoryById("story1")).toBeUndefined();
  });
});
