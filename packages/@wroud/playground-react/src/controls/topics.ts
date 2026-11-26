import { defineStoryTopic } from "../channel/StoryChannel.js";

export interface IStoryPropsIssue {
  path: string;
  message: string;
}

export const storyValuesTopic =
  defineStoryTopic<Record<string, unknown>>("story:values");

export const storyIssuesTopic =
  defineStoryTopic<IStoryPropsIssue[]>("story:issues");

export type StoryPanelValue = string | number | boolean | null;

export interface IStoryPanel {
  actions: string[];
  values: Record<string, StoryPanelValue>;
}

export const storyPanelTopic = defineStoryTopic<IStoryPanel>("story:panel");

export const storyActionTopic = defineStoryTopic<string>("story:action");
