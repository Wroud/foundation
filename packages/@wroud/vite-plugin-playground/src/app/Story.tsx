import { Template } from "./pages/Template.js";
import { useStory } from "./hooks/useStory.js";

interface Props {
  activeStoryId: string | null;
  preview?: boolean;
}

export function Story({ activeStoryId, preview }: Props) {
  const story = useStory(activeStoryId);

  let Component = story?.component ?? Template;

  if (preview && typeof story?.options.preview === "function") {
    Component = story.options.preview;
  }

  return <Component />;
}
