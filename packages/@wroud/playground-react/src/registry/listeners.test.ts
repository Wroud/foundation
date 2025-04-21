import { describe, test, expect, beforeEach, vi } from "vitest";
import {
  subscribeToRegistryChanges,
  executeInTransaction,
} from "./listeners.js";
import type { IDescribe } from "../IDescribe.js";
import type { IStory } from "../IStory.js";
import { registerStory } from "./stories.js";

// Create a mock React component for tests
const MockComponent = () => null;

describe("listeners", () => {
  // Reset the module state before each test
  beforeEach(() => {
    vi.resetModules();
  });

  test("subscribeToRegistryChanges should add and return unsubscribe function", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToRegistryChanges(listener);

    expect(typeof unsubscribe).toBe("function");

    unsubscribe();

    // Add a story to trigger listeners
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

    // Verify the listener wasn't called after unsubscribing
    expect(listener).not.toHaveBeenCalled();
  });

  test("listeners should be notified when stories or describes change", () => {
    const listener = vi.fn();
    subscribeToRegistryChanges(listener);

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

    expect(listener).toHaveBeenCalledTimes(1);
  });

  test("listeners should only be called once per transaction", () => {
    const listener = vi.fn();
    subscribeToRegistryChanges(listener);

    const parent: IDescribe = { id: "parent", name: "Parent", parent: null };
    const describe: IDescribe = {
      id: "describe1",
      name: "Describe 1",
      parent,
    };
    const story: IStory = {
      id: "story1",
      name: "Story 1",
      describe,
      component: MockComponent,
      options: {},
    };

    registerStory(story);

    // Despite adding parent, describe, and story, listener should be called once
    expect(listener).toHaveBeenCalledTimes(1);
  });

  test("executeInTransaction should batch operations", () => {
    const listener = vi.fn();
    subscribeToRegistryChanges(listener);

    executeInTransaction(() => {
      // Simulating multiple operations
      executeInTransaction(() => {
        // Nested transaction
      });
    });

    // Listener should only be called once after all transactions complete
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
