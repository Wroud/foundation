import type { IDescribe, IStory } from "@wroud/playground-react";
import { StoryCard } from "./StoryCard.js";
import { useDescribeGroup } from "./useDescribeGroup.js";

export interface DescribeGroupProps {
  describeId: string;
  describeName: string;
  searchTerm: string;
  level: number;
  onClick?: (storyId: string) => void;
}

export function DescribeGroup({
  describeId,
  describeName,
  searchTerm,
  level,
  onClick,
}: DescribeGroupProps) {
  const { stories, childDescribes } = useDescribeGroup(describeId, searchTerm);

  const hasDirectResults = stories.length > 0 || childDescribes.length > 0;

  if (!hasDirectResults) {
    return null;
  }

  return (
    <div className={`twp:space-y-4 ${level > 1 ? "twp:mb-12 twp:pl-4" : ""}`}>
      {level > 0 && (
        <h2 className={`twp:text-xl twp:font-medium twp:mb-2`}>
          {describeName}
        </h2>
      )}

      {stories.length > 0 && (
        <div
          className="twp:grid twp:gap-4"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(250px, 300px))",
          }}
        >
          {stories.map((story: IStory) => (
            <StoryCard key={story.id} story={story} onClick={onClick} />
          ))}
        </div>
      )}

      {childDescribes.map((describe: IDescribe) => (
        <DescribeGroup
          key={describe.id}
          describeId={describe.id}
          describeName={describe.name}
          searchTerm={searchTerm}
          level={level + 1}
          onClick={onClick}
        />
      ))}
    </div>
  );
}
