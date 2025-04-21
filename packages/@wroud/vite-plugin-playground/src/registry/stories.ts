import type { IStory } from "../IStory.js";
import {
  registerUnsubscribe,
  executeInTransaction,
  type UnsubscribeFn,
} from "./listeners.js";
import * as tree from "./tree.js";
import { registerDescribe } from "./describes.js";

// Private story storage
const stories = new Map<string, IStory>();

// Private accessor functions
function getStoryById(id: string): IStory | undefined {
  return stories.get(id);
}

function getAllStoriesArray(): IStory[] {
  return [...stories.values()];
}

function setStory(id: string, story: IStory): void {
  stories.set(id, story);
}

function removeStory(id: string): void {
  stories.delete(id);
}

/**
 * Register a story in the registry
 */
export function registerStory(story: IStory): UnsubscribeFn {
  return executeInTransaction(() => {
    // Register story
    setStory(story.id, story);
    tree.registerTreeNode(story.id, "story", story.describe.id);

    // Ensure describe exists and link story to it
    const deleteDescribe = registerDescribe(story.describe);
    tree.connectTreeNodes(story.describe.id, story.id);

    const unsubscribe = () =>
      executeInTransaction(() => {
        removeStory(story.id);
        tree.unregisterTreeNode(story.id);
        tree.disconnectTreeNodes(story.describe.id, story.id);
        deleteDescribe();
      });

    registerUnsubscribe(unsubscribe);
    return unsubscribe;
  });
}

/**
 * Fetch a story by ID
 */
export function fetchStoryById(id: string): IStory | undefined {
  return getStoryById(id);
}

/**
 * Fetch all stories from the registry
 */
export function fetchAllStories(): IStory[] {
  return getAllStoriesArray();
}

/**
 * Fetch stories belonging to a specific describe
 */
export function fetchStoriesForDescribe(describeId: string): IStory[] {
  return tree
    .getRegistryChildren(describeId)
    .filter((node) => node.type === "story")
    .map((node) => getStoryById(node.id)!)
    .filter(Boolean);
}
