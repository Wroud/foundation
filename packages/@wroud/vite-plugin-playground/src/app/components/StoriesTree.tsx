import { useStories } from "../hooks/useStories.js";
import { useDescribes } from "../hooks/useDescribes.js";
import { Link } from "@wroud/vite-plugin-ssg/react/components";
import { PlaygroundRoutes } from "../PlaygroundRoutes.js";
import { Tree, useTree } from "@wroud/react-tree";
import { useCreateReactiveValue } from "@wroud/react-reactive-value";
import { useStoriesTreeData } from "./useStoriesTreeData.js";
import { TreeNodeRenderer } from "./TreeNodeRenderer.js";
import { fetchStoryById } from "../../registry/stories.js";
import { useMemo } from "react";
import { fetchDocById } from "../../registry/docs.js";
import treeStyles from "@wroud/react-tree/styles.css?url";
import { useNavigation } from "../useNavigation.js";

interface Props {
  root: string;
  activeNodeId: string | null;
}

export function StoriesTree({ root, activeNodeId: activeStoryId }: Props) {
  const nodeHeight = useCreateReactiveValue(() => 24, null, []);
  const navigation = useNavigation();
  const describes = useDescribes(root);
  const stories = useStories(root);
  const treeData = useStoriesTreeData();

  const handleClick = (nodeId: string, event?: React.MouseEvent) => {
    // Handle navigation for story nodes
    const node = treeData.getNode(nodeId);
    if (node.leaf) {
      const story = fetchStoryById(nodeId);
      const doc = fetchDocById(nodeId);
      if (story || doc) {
        // Allow opening in new tab with cmd/ctrl+click
        if (event && (event.metaKey || event.ctrlKey)) {
          return;
        }

        // Prevent default link behavior for normal clicks
        if (event) {
          event.preventDefault();
        }

        navigation.navigate({
          id: PlaygroundRoutes.story,
          params: { story: nodeId.slice(1).split("/") },
        });
      }
    } else {
      tree.expandNode(nodeId, !tree.isExpanded(nodeId), true);
    }
  };

  const tree = useTree({
    data: treeData,
    onClick: handleClick,
  });

  useMemo(() => {
    if (activeStoryId !== null) {
      const parentId = treeData.getParent?.(activeStoryId) ?? null;

      if (parentId !== null) {
        tree.expandNode(parentId, true, true);
      }
    }
  }, [activeStoryId]);

  if (describes.length === 0 && stories.length === 0) {
    return null;
  }

  return (
    <>
      <Link rel="stylesheet" href={treeStyles} />
      <Tree
        tree={tree}
        nodeHeight={nodeHeight}
        controlRenderer={TreeNodeRenderer}
      />
    </>
  );
}
