import type { IDescribe, IStory } from "@wroud/playground-react";
import {
  fetchChildDescribes,
  fetchStoriesForDescribe,
} from "@wroud/playground-react/registry";
import { useDescribes, useStories } from "@wroud/playground-react/views";

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
