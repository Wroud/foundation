import { describe, Link, story, useStoryPanel } from "@wroud/playground-react";
import { forwardRef, memo, useContext, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { Tree } from "../tree/Tree.js";
import { useCreateReactiveValue } from "@wroud/react-reactive-value";
import type { ITreeData } from "../tree/ITreeData.js";
import type { ITree } from "../tree/ITree.js";
import { useTree } from "../tree/useTree.js";
import treeStyles from "../tree/Tree.css?url";
import storiesStyles from "./Tree.stories.css?url";
import type { NodeControlProps } from "../node/NodeControl.js";
import { TreeNodeControl } from "../controls/TreeNodeControl.js";
import { TreeNodeExpand } from "../controls/TreeNodeExpand.js";
import { TreeNodeIcon } from "../controls/TreeNodeIcon.js";
import { TreeNodeName } from "../controls/TreeNodeName.js";
import { TreeDataContext } from "../tree/TreeDataContext.js";

export const TreeNodeRenderer = memo(
  forwardRef<HTMLDivElement, NodeControlProps>(function TreeNodeRenderer(
    { nodeId },
    ref,
  ) {
    const data = useContext(TreeDataContext)!;
    const node = data.getNode(nodeId);

    return (
      <TreeNodeControl
        ref={ref}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "2px",
        }}
      >
        <TreeNodeExpand
          leaf={node.leaf}
          expandedComponent={<i className="codicon codicon-chevron-down" />}
          collapsedComponent={<i className="codicon codicon-chevron-right" />}
        />
        <TreeNodeIcon
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <i className={"codicon codicon-symbol-file"} />
        </TreeNodeIcon>
        <TreeNodeName title={node.tooltip ?? node.name}>
          {node.name}
        </TreeNodeName>
      </TreeNodeControl>
    );
  }),
);

function useTreeData({
  depth,
  breadth,
  onExpand,
  onSelect,
  onClick,
}: {
  depth: number;
  breadth: number;
  onExpand?: (nodeId: string, expanded: boolean) => void;
  onSelect?: (nodeId: string, selected: boolean) => void;
  onClick?: (nodeId: string, event?: React.MouseEvent) => void;
}): ITree {
  const [, forceUpdate] = useState({});
  const { nodes, states } = useMemo(
    () => ({
      nodes: new Map<
        string,
        { name: string; leaf?: boolean; tooltip?: string }
      >(),
      states: new Map<string, { expanded: boolean; selected: boolean }>(),
    }),
    [depth, breadth],
  );

  const getLevel = (id: string) =>
    id === "root" ? 0 : id.split("-").length - 1;

  const treeData: ITreeData = {
    rootId: "root",

    getNode(id: string) {
      if (!nodes.has(id)) {
        nodes.set(id, {
          name: id === "root" ? "Root" : `Node ${id.split("-").pop()}`,
          leaf: getLevel(id) >= depth,
          tooltip: `This is node ${id}`,
        });
      }
      return nodes.get(id)!;
    },

    getChildren(nodeId: string) {
      if (getLevel(nodeId) >= depth) return [];
      return Array.from({ length: breadth }, (_, i) => `${nodeId}-${i}`);
    },

    getState(id: string) {
      if (!states.has(id)) {
        states.set(id, { expanded: id === this.rootId, selected: false });
      }
      return states.get(id)!;
    },

    updateState(id, state) {
      states.set(id, { ...this.getState(id), ...state });
      forceUpdate({});
    },

    updateStateAll(state) {
      states.forEach((current, id) => {
        states.set(id, { ...current, ...state });
      });
      forceUpdate({});
    },

    async load(nodeId: string) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      this.getNode(nodeId);
    },

    async update() {},
  };

  return useTree({ data: treeData, onClick, onSelect, onExpand });
}

function TreeView({
  tree,
  nodeHeight,
  bordered = true,
  wrapperRef,
  onScroll,
}: {
  tree: ITree;
  nodeHeight: number;
  bordered?: boolean;
  wrapperRef?: React.Ref<HTMLDivElement>;
  onScroll?: () => void;
}) {
  const height = useCreateReactiveValue(() => nodeHeight, null, [nodeHeight]);

  return (
    <div className="story-container">
      <Link rel="stylesheet" href={treeStyles} />
      <Link rel="stylesheet" href={storiesStyles} />
      <div
        ref={wrapperRef}
        className={bordered ? "tree-wrapper" : "tree-wrapper no-border"}
        onScroll={onScroll}
      >
        <Tree
          tree={tree}
          nodeHeight={height}
          controlRenderer={TreeNodeRenderer}
        />
      </div>
    </div>
  );
}

const treeProps = z.object({
  depth: z
    .int()
    .min(1)
    .max(8)
    .default(4)
    .meta({ control: "range" })
    .describe("Levels below the root"),
  breadth: z
    .int()
    .min(1)
    .max(10)
    .default(4)
    .meta({ control: "range" })
    .describe("Children per node"),
  nodeHeight: z
    .int()
    .min(16)
    .max(48)
    .default(24)
    .meta({ control: "range" })
    .describe("Row height in px"),
});

function formatNumber(value: number) {
  return Number.isFinite(value) ? new Intl.NumberFormat().format(value) : "∞";
}

describe("@wroud/react-tree", () => {
  story(
    "Basic Usage",
    function BasicUsageStory({ depth, breadth, nodeHeight }) {
      const [lastExpanded, setLastExpanded] = useState<string | null>(null);
      const tree = useTreeData({
        depth,
        breadth,
        onExpand: (nodeId, expanded) =>
          setLastExpanded(expanded ? nodeId : null),
      });

      useStoryPanel({ values: { "Last expanded": lastExpanded } });

      return <TreeView tree={tree} nodeHeight={nodeHeight} />;
    },
    {
      props: treeProps,
      description:
        "Click nodes to expand or collapse them; the tree manages its own state",
      preview: function BasicUsagePreview() {
        const tree = useTreeData({ depth: 4, breadth: 4 });

        tree.expandNode("root-1", true);
        tree.expandNode("root-1-1", true);

        return <TreeView tree={tree} nodeHeight={24} bordered={false} />;
      },
    },
  );

  story(
    "Custom Control",
    function CustomControlStory({ depth, breadth, nodeHeight }) {
      const [lastAction, setLastAction] = useState<string | null>(null);
      const [selectedNode, setSelectedNode] = useState<string | null>(null);
      const tree = useTreeData({
        depth,
        breadth,
        onClick: (nodeId) => setLastAction(`Clicked ${nodeId}`),
        onSelect: (nodeId, selected) => {
          setSelectedNode(selected ? nodeId : null);
          setLastAction(`${selected ? "Selected" : "Deselected"} ${nodeId}`);
        },
        onExpand: (nodeId, expanded) =>
          setLastAction(`${expanded ? "Expanded" : "Collapsed"} ${nodeId}`),
      });

      function expandFirstLevel(expand: boolean) {
        for (const nodeId of tree.data.getChildren(tree.data.rootId)) {
          tree.expandNode(nodeId, expand);
        }
      }

      useStoryPanel({
        actions: {
          "Expand first level": () => expandFirstLevel(true),
          "Collapse first level": () => expandFirstLevel(false),
          "Select node 0": () => tree.selectNode("root-0", true),
          "Select node 1": () => tree.selectNode("root-1", true),
        },
        values: { "Last action": lastAction, "Selected node": selectedNode },
      });

      return <TreeView tree={tree} nodeHeight={nodeHeight} />;
    },
    {
      props: treeProps.extend({ breadth: treeProps.shape.breadth.default(3) }),
      description:
        "Expand, collapse and select nodes programmatically and observe tree events",
    },
  );

  story(
    "Virtualization Demo",
    function VirtualizationDemoStory({ depth, breadth, nodeHeight }) {
      const wrapperRef = useRef<HTMLDivElement>(null);
      const frameRef = useRef<number | null>(null);
      const [stats, setStats] = useState({ rendered: 0, expanded: 0 });

      function measure() {
        if (frameRef.current !== null) return;
        frameRef.current = requestAnimationFrame(() => {
          frameRef.current = null;
          const wrapper = wrapperRef.current;
          if (!wrapper) return;
          const rendered = wrapper.querySelectorAll(
            '[class*="react-tree-expand-control"]',
          ).length;
          const expanded = wrapper.querySelectorAll(
            '[class*="react-tree-expand-control"][data-expanded="true"]',
          ).length;
          setStats((current) =>
            current.rendered === rendered && current.expanded === expanded
              ? current
              : { rendered, expanded },
          );
        });
      }

      const tree = useTreeData({ depth, breadth, onExpand: measure });
      const possibleNodes =
        breadth === 1
          ? depth + 1
          : (Math.pow(breadth, depth + 1) - 1) / (breadth - 1);

      useStoryPanel({
        actions: { "Update stats": measure },
        values: {
          "Possible nodes": formatNumber(possibleNodes),
          "Rendered nodes": stats.rendered,
          "Expanded nodes": stats.expanded,
        },
      });

      return (
        <TreeView
          tree={tree}
          nodeHeight={nodeHeight}
          wrapperRef={wrapperRef}
          onScroll={measure}
        />
      );
    },
    {
      props: treeProps.extend({
        depth: z.int().min(1).max(10000).default(1000),
        breadth: z.int().min(1).max(10000).default(1000),
      }),
      description:
        "Only nodes near the viewport are rendered; expand and scroll to see the rendered count stay low",
    },
  );
});
