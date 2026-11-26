import { StoryFrame, useStory } from "@wroud/playground-react/views";
import { Template } from "./pages/Template.js";

interface Props {
  activeStoryId: string | null;
  preview?: boolean;
}

export function Story({ activeStoryId, preview }: Props) {
  const story = useStory(activeStoryId);

  if (!story) {
    return <Template />;
  }

  if (preview && typeof story.options.preview === "function") {
    const Preview = story.options.preview;
    return <Preview />;
  }

  return <StoryFrame key={story.id} story={story} />;
}
