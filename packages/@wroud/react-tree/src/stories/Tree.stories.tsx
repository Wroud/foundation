import { describe, Link, story } from "@wroud/playground-react";
import {
  forwardRef,
  memo,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
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

// Hook to create and manage tree data
function useTreeData({
  depth = 3,
  breadth = 4,
  onExpand,
  onSelect,
  onClick,
}: {
  depth?: number;
  breadth?: number;
  onExpand?: (nodeId: string, expanded: boolean) => void;
  onSelect?: (nodeId: string, selected: boolean) => void;
  onClick?: (nodeId: string, event?: React.MouseEvent) => void;
}): ITree {
  // State to trigger re-renders
  const [, forceUpdate] = useState({});

  // Refs to hold the data collections - these will be populated on-demand
  const nodeStatesRef = useRef(
    new Map<string, { expanded: boolean; selected: boolean }>(),
  );
  const nodesRef = useRef(
    new Map<string, { name: string; leaf?: boolean; tooltip?: string }>(),
  );

  // Memoize the generateChildren function with hierarchical IDs
  const generateChildren = useCallback(
    (nodeId: string, currentLevel: number): string[] => {
      if (currentLevel >= depth) return [];

      const children: string[] = [];

      // Create hierarchical IDs to ensure unique children per parent
      for (let i = 0; i < breadth; i++) {
        // Use nodeId as prefix for children to create a path-like structure
        children.push(`${nodeId}-${i}`);
      }

      return children;
    },
    [depth, breadth],
  );

  // Create the tree data object with lazy loading behavior
  const treeData: ITreeData = {
    rootId: "root",

    getNode(id: string) {
      // Check if the node is already cached
      if (!nodesRef.current.has(id)) {
        // Create and cache the node on first request
        // Extract level from the ID structure
        const level = id === "root" ? 0 : id.split("-").length;
        const nodeName = id === "root" ? "Root" : `Node ${id.split("-").pop()}`;

        nodesRef.current.set(id, {
          name: nodeName,
          leaf: level >= depth,
          tooltip: `This is node ${id}`,
        });
      }

      return nodesRef.current.get(id) || { name: `Node ${id}` };
    },

    getChildren(nodeId: string) {
      // Extract level from the hierarchical ID
      const level = nodeId === "root" ? 0 : nodeId.split("-").length;

      if (level >= depth) return [];

      // Generate children dynamically with hierarchical IDs
      return generateChildren(nodeId, level);
    },

    getState(id: string) {
      // Create the state on first request if it doesn't exist
      if (!nodeStatesRef.current.has(id)) {
        // If this is the root node, set it as expanded by default
        nodeStatesRef.current.set(id, {
          expanded: id === this.rootId,
          selected: false,
        });
      }

      return (
        nodeStatesRef.current.get(id) || {
          expanded: id === this.rootId, // Always return expanded: true for the root node
          selected: false,
        }
      );
    },

    updateState(
      id: string,
      state: Partial<{ expanded: boolean; selected: boolean }>,
    ) {
      // Get current state (which creates it if it doesn't exist)
      const currentState = this.getState(id);

      // Update the state
      nodeStatesRef.current.set(id, { ...currentState, ...state });

      // Force a re-render
      forceUpdate({});
    },

    updateStateAll(state: Partial<{ expanded: boolean; selected: boolean }>) {
      nodeStatesRef.current.forEach((currentState, id) => {
        nodeStatesRef.current.set(id, { ...currentState, ...state });
      });

      // Force a re-render
      forceUpdate({});
    },

    async load(nodeId: string, _manual: boolean) {
      // Simulate async loading
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Since we're doing lazy loading, just ensure this node is in the cache
      this.getNode(nodeId);

      return;
    },

    async update() {
      // Simulate update
      return;
    },
  };

  // Create tree instance with the data and callbacks
  return useTree({
    data: treeData,
    onClick,
    onSelect,
    onExpand,
  });
}

describe("@wroud/react-tree", () => {
  story(
    "Basic Usage",
    function BasicUsageStory() {
      const nodeHeight = useCreateReactiveValue(() => 24, null, []);
      const [lastExpanded, setLastExpanded] = useState<string | null>(null);

      const handleExpand = useCallback((nodeId: string, expanded: boolean) => {
        setLastExpanded(expanded ? nodeId : null);
        console.log(`Node ${nodeId} ${expanded ? "expanded" : "collapsed"}`);
      }, []);

      const tree = useTreeData({
        depth: 4,
        breadth: 4,
        onExpand: handleExpand,
      });

      return (
        <div className="story-container">
          <Link rel="stylesheet" href={treeStyles} />
          <Link rel="stylesheet" href={storiesStyles} />
          <div className="tree-container">
            <div className="tree-wrapper">
              <Tree
                tree={tree}
                nodeHeight={nodeHeight}
                controlRenderer={TreeNodeRenderer}
              />
            </div>
          </div>
          <div className="side-panel">
            <div className="info-panel">
              <h3 className="panel-title">Tree State</h3>
              <div className="info-text">
                Last expanded:{" "}
                <span className="info-value">{lastExpanded || "None"}</span>
              </div>
            </div>
            <div className="info-panel">
              <h3 className="panel-title">Basic Tree Features</h3>
              <ul className="feature-list">
                <li>Click on nodes to expand/collapse</li>
                <li>Tree state is managed internally</li>
                <li>Responsive and smooth interactions</li>
              </ul>
            </div>
          </div>
        </div>
      );
    },
    {
      preview: function BasicUsageStory() {
        const nodeHeight = useCreateReactiveValue(() => 24, null, []);

        const tree = useTreeData({
          depth: 4,
          breadth: 4,
        });

        tree.expandNode("root-1", true);
        tree.expandNode("root-1-1", true);

        return (
          <div className="story-container">
            <Link rel="stylesheet" href={treeStyles} />
            <Link rel="stylesheet" href={storiesStyles} />
            <div className="tree-container">
              <div className="tree-wrapper no-border">
                <Tree
                  tree={tree}
                  nodeHeight={nodeHeight}
                  controlRenderer={TreeNodeRenderer}
                />
              </div>
            </div>
          </div>
        );
      },
      description: "Basic usage of the Tree component",
    },
  );

  story("Custom Control", function CustomControlStory() {
    const nodeHeight = useCreateReactiveValue(() => 24, null, []);
    const [lastAction, setLastAction] = useState<string>("No actions yet");
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    const treeRef = useRef<ITree | null>(null);

    // Event handlers
    const handleClick = useCallback((nodeId: string) => {
      setLastAction(`Clicked node: ${nodeId}`);
    }, []);

    const handleSelect = useCallback(
      (nodeId: string, selected: boolean) => {
        if (selected) {
          setSelectedNode(nodeId);
          setLastAction(`Selected node: ${nodeId}`);
        } else if (selectedNode === nodeId) {
          setSelectedNode(null);
        }
      },
      [selectedNode],
    );

    const handleExpand = useCallback((nodeId: string, expanded: boolean) => {
      setLastAction(`${expanded ? "Expanded" : "Collapsed"} node: ${nodeId}`);
    }, []);

    // Custom action functions
    const expandAll = useCallback(() => {
      if (treeRef.current) {
        // Get all nodes at level 1
        const level1Nodes = treeRef.current.data.getChildren(
          treeRef.current.data.rootId,
        );

        // Expand each node
        level1Nodes.forEach((nodeId) => {
          treeRef.current?.expandNode(nodeId, true);
        });

        setLastAction("Expanded all first-level nodes");
      }
    }, []);

    const collapseAll = useCallback(() => {
      if (treeRef.current) {
        // Get all nodes at level 1
        const level1Nodes = treeRef.current.data.getChildren(
          treeRef.current.data.rootId,
        );

        // Collapse each node
        level1Nodes.forEach((nodeId) => {
          treeRef.current?.expandNode(nodeId, false);
        });

        setLastAction("Collapsed all nodes");
      }
    }, []);

    const selectNode = useCallback((nodeId: string) => {
      if (treeRef.current) {
        // First expand parent nodes if needed
        const level = parseInt(nodeId.split("-")[0] || "0");
        const parts = nodeId.split("-");

        if (level > 1 && parts.length > 1) {
          // We need to expand parent nodes
          const parentId = `${level - 1}-${parts[1]}`;
          treeRef.current.expandNode(parentId, true);
        }

        // Then select the node
        treeRef.current.selectNode(nodeId, true);
        setLastAction(`Programmatically selected node: ${nodeId}`);
      }
    }, []);

    // Get tree instance and save reference
    const tree = useTreeData({
      depth: 4,
      breadth: 3,
      onExpand: handleExpand,
      onSelect: handleSelect,
      onClick: handleClick,
    });

    // Store tree reference when rendered
    useEffect(() => {
      treeRef.current = tree;
    }, [tree]);

    return (
      <div className="story-container">
        <Link rel="stylesheet" href={treeStyles} />
        <Link rel="stylesheet" href={storiesStyles} />
        <div className="tree-container">
          <div className="tree-wrapper">
            <Tree
              tree={tree}
              nodeHeight={nodeHeight}
              controlRenderer={TreeNodeRenderer}
            />
          </div>
        </div>
        <div className="side-panel">
          <div className="control-panel">
            <h3 className="panel-title">Control Panel</h3>
            <div className="button-group">
              <button onClick={expandAll} className="primary-button">
                Expand All First Level
              </button>
              <button onClick={collapseAll} className="secondary-button">
                Collapse All
              </button>
              <div className="divider"></div>
              <h4 className="section-title">Select Node</h4>
              <div className="button-grid">
                <button
                  onClick={() => selectNode("root-0")}
                  className="action-button"
                >
                  Select Node 0-0
                </button>
                <button
                  onClick={() => selectNode("root-1")}
                  className="action-button"
                >
                  Select Node 0-1
                </button>
              </div>
            </div>
          </div>

          <div className="info-panel">
            <h3 className="panel-title">Tree State</h3>
            <div className="info-text">
              Last action: <span className="highlight-text">{lastAction}</span>
            </div>
            <div className="info-text">
              Selected node:{" "}
              <span className="info-value">{selectedNode || "None"}</span>
            </div>
          </div>

          <div className="info-panel">
            <h3 className="panel-title">Custom Control Features</h3>
            <ul className="feature-list">
              <li>Programmatically expand/collapse nodes</li>
              <li>Programmatically select specific nodes</li>
              <li>Handle click, select, and expand events</li>
              <li>Access tree state and methods externally</li>
            </ul>
          </div>
        </div>
      </div>
    );
  });

  story("Virtualization Demo (1000 Nodes)", function VirtualizationDemoStory() {
    // Define parameters for a large tree
    const treeDepth = 1000; // Max depth
    const treeBreadth = 1000; // Children per node

    // Create a stable nodeHeight value
    const nodeHeight = useCreateReactiveValue(() => 24, null, []);

    // Stats about visible nodes
    const [stats, setStats] = useState({
      visibleCount: 0,
      expandedNodes: 0,
    });

    // References for DOM measurements
    const containerRef = useRef<HTMLDivElement>(null);
    const isMountedRef = useRef(true);

    // Calculate the theoretical total nodes for display only
    // For tree with breadth B and depth D: (B^D - 1) / (B - 1)
    const totalPossibleNodes = Math.floor(
      (Math.pow(treeBreadth, treeDepth) - 1) / (treeBreadth - 1),
    );

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        isMountedRef.current = false;
      };
    }, []);

    // Measure visible nodes in the DOM
    const measureVisibleNodes = useCallback(() => {
      if (!containerRef.current || !isMountedRef.current) return;

      // Use a small timeout to avoid performance issues
      setTimeout(() => {
        if (!containerRef.current || !isMountedRef.current) return;

        try {
          const visibleCount = containerRef.current.querySelectorAll(
            '[class*="react-tree-expand-control"]',
          ).length;

          const expandedNodes = containerRef.current.querySelectorAll(
            '[class*="react-tree-expand-control"][data-expanded="true"]',
          ).length;

          setStats({
            visibleCount,
            expandedNodes,
          });
        } catch (e) {
          console.error("Error measuring nodes:", e);
        }
      }, 100);
    }, []);

    // Handle scroll events to update stats
    const handleScroll = useCallback(() => {
      if (containerRef.current) {
        // Debounce full measurement
        const timeoutId = setTimeout(measureVisibleNodes, 150);
        return () => clearTimeout(timeoutId);
      }
      return () => {};
    }, [measureVisibleNodes]);

    // Set up scroll event listener
    useEffect(() => {
      const container = containerRef.current;
      if (container) {
        container.addEventListener("scroll", handleScroll);
        return () => {
          container.removeEventListener("scroll", handleScroll);
        };
      }
      return () => {};
    }, [handleScroll]);

    // Measure nodes after initial render
    useEffect(() => {
      const timeoutId = setTimeout(measureVisibleNodes, 500);
      return () => clearTimeout(timeoutId);
    }, [measureVisibleNodes]);

    // Format large numbers for display - handles Infinity correctly
    const formatNumber = (num: number) => {
      if (!isFinite(num)) {
        return "∞";
      }
      return new Intl.NumberFormat().format(num);
    };

    // Create the tree
    const tree = useTreeData({
      depth: treeDepth,
      breadth: treeBreadth,
      onExpand: measureVisibleNodes,
    });

    return (
      <div className="story-container">
        <Link rel="stylesheet" href={treeStyles} />
        <Link rel="stylesheet" href={storiesStyles} />
        <div className="tree-container">
          <div
            ref={containerRef}
            className="tree-wrapper"
            onScroll={handleScroll}
          >
            <Tree
              tree={tree}
              nodeHeight={nodeHeight}
              controlRenderer={TreeNodeRenderer}
            />
          </div>
        </div>
        <div className="side-panel">
          <div className="stats-panel">
            <div className="panel-header">
              <h3 className="panel-title">Virtualization Stats</h3>
            </div>
            <div className="stats-grid">
              <div>Tree depth:</div>
              <div className="stat-value">{treeDepth}</div>

              <div>Branch factor:</div>
              <div className="stat-value">{treeBreadth}</div>

              <div>Possible nodes:</div>
              <div className="mono-value">
                {totalPossibleNodes.toLocaleString()}
              </div>

              <div>Currently rendering:</div>
              <div className="highlight-mono">
                {formatNumber(stats.visibleCount)} nodes
              </div>

              <div>Expanded nodes:</div>
              <div className="mono-value">{stats.expandedNodes}</div>
            </div>

            <button className="update-button" onClick={measureVisibleNodes}>
              Update Stats
            </button>
          </div>

          <div className="info-panel">
            <h3 className="panel-title">How Virtualization Works</h3>
            <ul className="feature-list">
              <li>
                Only nodes in or near the viewport are actually rendered in the
                DOM
              </li>
              <li>
                As you scroll, nodes outside view are removed and new ones are
                added
              </li>
              <li>
                This allows trees with thousands of nodes to render efficiently
              </li>
              <li>
                Try expanding nodes and scrolling to see the rendered node count
                change
              </li>
              <li>
                Notice the low node count compared to the total possible nodes
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  });
});
