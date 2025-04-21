import { useState, useCallback } from "react";
import { useNavigation } from "../../useNavigation.js";
import { PlaygroundRoutes } from "../../PlaygroundRoutes.js";
import { DescribeGroup } from "./DescribeGroup.js";
import { SearchInput } from "./SearchInput.js";
import { useDescribeGroup } from "./useDescribeGroup.js";

export function ComponentsGrid() {
  const navigation = useNavigation();
  const [searchTerm, setSearchTerm] = useState("");
  const { stories, childDescribes } = useDescribeGroup("/", searchTerm);

  const handleStoryClick = useCallback(
    (storyId: string) => {
      navigation.navigate({
        id: PlaygroundRoutes.story,
        params: {
          story: storyId.slice(1).split("/"),
        },
      });
    },
    [navigation],
  );

  const hasResults = stories.length > 0 || childDescribes.length > 0;

  return (
    <div className="twp:flex twp:flex-col twp:p-6 twp:h-full twp:overflow-auto">
      <div className="twp:mb-6">
        <h1 className="twp:text-2xl twp:font-semibold twp:mb-4">Components</h1>
        <p className="twp:text-zinc-600 twp:dark:text-zinc-400">
          Browse all available components in the library.
        </p>

        <div className="twp:mt-4">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search components..."
          />
        </div>
      </div>

      <div className="twp:space-y-8">
        <DescribeGroup
          describeId="/"
          describeName="Components"
          searchTerm={searchTerm}
          level={0}
          onClick={handleStoryClick}
        />

        {!hasResults && searchTerm !== "" && (
          <div className="twp:text-center twp:py-10 twp:text-zinc-500 twp:dark:text-zinc-400">
            No components match your search
          </div>
        )}
      </div>
    </div>
  );
}
