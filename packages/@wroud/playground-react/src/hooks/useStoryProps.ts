import { startTransition, useRef, useState } from "react";
import type { IStory } from "../IStory.js";
import {
  formatStoryIssues,
  getInitialStoryProps,
  resolveStoryProps,
} from "../controls/jsonSchema.js";
import type { StoryChannel } from "../channel/StoryChannel.js";
import { useChannelListener } from "../channel/react.js";
import { storyIssuesTopic, storyValuesTopic } from "../controls/topics.js";

export function useStoryProps(
  story: IStory,
  channel: StoryChannel | null,
): Record<string, unknown> {
  const [props, setProps] = useState(() => getInitialStoryProps(story));
  const latest = useRef(0);
  const schema = story.options.props;

  useChannelListener(channel, storyValuesTopic, (values) => {
    if (!schema) {
      return;
    }
    const request = ++latest.current;
    Promise.resolve(resolveStoryProps(schema, values)).then((result) => {
      if (request !== latest.current) {
        return;
      }
      channel?.send(storyIssuesTopic, formatStoryIssues(result.issues ?? []));
      if (!result.issues) {
        startTransition(() => {
          setProps(result.value);
        });
      }
    });
  });

  return props;
}
