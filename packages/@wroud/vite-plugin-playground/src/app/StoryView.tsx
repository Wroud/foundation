import type { IStory } from "@wroud/playground-react";
import { IframeView, useStory } from "@wroud/playground-react/views";
import {
  StoryChannelContext,
  useHostChannel,
} from "@wroud/playground-react/channel";
import { PropsSection } from "./controls/PropsControls.js";
import { StoryPanelSections } from "./controls/StoryPanelSections.js";

interface Props {
  nodeId: string | null;
}

export function StoryView({ nodeId }: Props) {
  const story = useStory(nodeId);

  if (!story) {
    return <IframeView nodeId={nodeId} />;
  }

  return <StoryWithPanel key={story.id} story={story} />;
}

function StoryWithPanel({ story }: { story: IStory }) {
  const { channel, iframeRef } = useHostChannel(story.id);

  return (
    <StoryChannelContext value={channel}>
      <div className="twp:flex twp:flex-auto twp:flex-col twp:overflow-hidden twp:md:flex-row">
        <div className="twp:min-h-0 twp:min-w-0 twp:flex-auto">
          <IframeView nodeId={story.id} iframeRef={iframeRef} />
        </div>
        <aside
          aria-label="Story controls"
          className="twp:flex twp:max-h-[40%] twp:shrink-0 twp:flex-col twp:gap-8 twp:overflow-auto twp:border-t twp:border-zinc-900/10 twp:p-4 twp:empty:hidden twp:md:max-h-none twp:md:w-80 twp:md:border-t-0 twp:md:border-l twp:dark:border-white/10"
        >
          <PropsSection story={story} />
          <StoryPanelSections />
        </aside>
      </div>
    </StoryChannelContext>
  );
}
