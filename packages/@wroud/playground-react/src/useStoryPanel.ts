import { useMemo } from "react";
import {
  useChannelListener,
  useChannelPublish,
  useStoryChannel,
} from "./channel/react.js";
import {
  storyActionTopic,
  storyPanelTopic,
  type IStoryPanel,
  type StoryPanelValue,
} from "./controls/topics.js";

export interface IStoryPanelOptions {
  actions?: Record<string, () => void>;
  values?: Record<string, StoryPanelValue>;
}

export function useStoryPanel({
  actions = {},
  values = {},
}: IStoryPanelOptions): void {
  const channel = useStoryChannel();
  const actionNames = Object.keys(actions);
  const key = JSON.stringify([actionNames, values]);
  const panel = useMemo<IStoryPanel>(
    () => ({ actions: actionNames, values }),
    [key],
  );

  useChannelPublish(channel, storyPanelTopic, panel);
  useChannelListener(channel, storyActionTopic, (action) => {
    actions[action]?.();
  });
}
