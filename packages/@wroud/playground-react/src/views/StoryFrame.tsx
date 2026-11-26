import type { IStory } from "../IStory.js";
import { StoryChannelContext, useFrameChannel } from "../channel/react.js";
import { useStoryProps } from "../hooks/useStoryProps.js";

export function StoryFrame({ story }: { story: IStory }) {
  const channel = useFrameChannel(story.id);
  const props = useStoryProps(story, channel);
  const Component = story.component;

  return (
    <StoryChannelContext value={channel}>
      <Component {...props} />
    </StoryChannelContext>
  );
}
