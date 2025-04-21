import type { IStory } from "@wroud/playground-react";
import { IframeView } from "@wroud/playground-react/views";

export interface StoryCardProps {
  story: IStory;
  onClick?: (storyId: string) => void;
}

export function StoryCard({ story, onClick }: StoryCardProps) {
  function handleClick() {
    onClick?.(story.id);
  }

  return (
    <div
      className="twp:rounded-lg twp:overflow-hidden twp:transition-all twp:cursor-pointer twp:bg-zinc-100 twp:dark:bg-zinc-800 twp:hover:shadow-lg"
      onClick={handleClick}
    >
      <div className="twp:h-40 twp:overflow-hidden twp:relative twp:rounded-lg twp:border twp:border-zinc-200 twp:dark:border-zinc-700 twp:bg-white twp:dark:bg-zinc-900">
        <div
          className="twp:w-full twp:h-full"
          style={{ pointerEvents: "none" }}
        >
          <IframeView nodeId={story.id} preview />
        </div>
      </div>
      <div className="twp:p-3">
        <h3 className="twp:font-medium">{story.name}</h3>
        {story.options.description && (
          <p className="twp:text-sm twp:text-zinc-600 twp:dark:text-zinc-400 twp:mt-1">
            {story.options.description}
          </p>
        )}
      </div>
    </div>
  );
}
