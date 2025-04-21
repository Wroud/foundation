import { useStories } from "../../hooks/useStories.js";
import { useDescribes } from "../../hooks/useDescribes.js";
import type { IStory } from "../../../IStory.js";
import type { IDescribe } from "../../../IDescribe.js";
import { fetchStoriesForDescribe } from "../../../registry/stories.js";
import { fetchChildDescribes } from "../../../registry/describes.js";

export interface DescribeGroupResult {
  stories: IStory[];
  childDescribes: IDescribe[];
}

export function useDescribeGroup(
  describeId: string,
  searchTerm: string,
): DescribeGroupResult {
  const stories = useStories(describeId).filter(matchStory(searchTerm));
  const childDescribes = useDescribes(describeId).filter(
    matchDescribe(searchTerm),
  );

  return {
    stories,
    childDescribes,
  };
}

function matchDescribe(searchTerm: string) {
  return (describe: IDescribe) => {
    return (
      fetchStoriesForDescribe(describe.id).some(matchStory(searchTerm)) ||
      fetchChildDescribes(describe.id).some(matchDescribe(searchTerm))
    );
  };
}

function matchStory(searchTerm: string) {
  return (story: IStory) => {
    if (!story.options.preview) {
      return false;
    }

    if (searchTerm === "") {
      return true;
    }

    return story.name.toLowerCase().includes(searchTerm.toLowerCase());
  };
}
