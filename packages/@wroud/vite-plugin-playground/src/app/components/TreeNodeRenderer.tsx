import { forwardRef, useContext, memo } from "react";
import {
  TreeDataContext,
  TreeNodeControl,
  TreeNodeExpand,
  TreeNodeName,
  TreeNodeIcon,
  type NodeControlProps,
} from "@wroud/react-tree";
import { getRegistryNode } from "../../registry/tree.js";
import { PlaygroundRoutes } from "../PlaygroundRoutes.js";
import { useNavigation } from "../useNavigation.js";

export const TreeNodeRenderer = memo(
  forwardRef<HTMLDivElement, NodeControlProps>(function TreeNodeRenderer(
    { nodeId },
    ref,
  ) {
    const navigation = useNavigation();
    const data = useContext(TreeDataContext)!;
    const node = data.getNode(nodeId);

    const registryNode = getRegistryNode(nodeId);
    const isDescribe = registryNode?.type === "describe";
    const isDoc = registryNode?.type === "doc";
    return (
      <TreeNodeControl
        ref={ref}
        className="twp:text-zinc-600 twp:hover:text-zinc-900 twp:dark:text-zinc-400 twp:dark:hover:text-white twp:flex twp:items-center twp:gap-0.5"
      >
        <TreeNodeExpand
          leaf={node.leaf}
          expandedComponent={<i className="codicon codicon-chevron-down" />}
          collapsedComponent={<i className="codicon codicon-chevron-right" />}
        />
        {!isDescribe && (
          <TreeNodeIcon className="twp:flex twp:items-center twp:justify-center">
            <i
              className={
                !isDoc ? "codicon codicon-symbol-file" : "codicon codicon-book"
              }
            />
          </TreeNodeIcon>
        )}
        <TreeNodeName title={node.tooltip ?? node.name}>
          {isDescribe ? (
            node.name
          ) : (
            <a
              className="twp:overflow-ellipsis twp:overflow-hidden"
              href={
                navigation.router.matcher?.stateToUrl({
                  id: PlaygroundRoutes.story,
                  params: {
                    story: nodeId.slice(1).split("/"),
                  },
                }) ?? "#"
              }
            >
              {node.name}
            </a>
          )}
        </TreeNodeName>
      </TreeNodeControl>
    );
  }),
);
