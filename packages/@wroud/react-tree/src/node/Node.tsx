import { useContext, memo } from "react";
import { TreeContext } from "../tree/TreeContext.js";
import type { NodeComponent } from "./NodeComponent.js";
import { TreeClassesContext } from "../tree/TreeClassesContext.js";
import { TreeNodeProvider } from "./TreeNodeContext.js";
import clsx from "clsx";

export const Node: NodeComponent = memo(function Node({
  nodeId,
  offsetHeight,
  childrenRenderer,
  controlRenderer,
}) {
  const tree = useContext(TreeContext)!;
  const classes = useContext(TreeClassesContext);

  const expanded = tree.isExpanded(nodeId);
  const selected = tree.isSelected(nodeId);

  const ChildrenRenderer = childrenRenderer;
  const ControlRenderer = controlRenderer;

  return (
    <TreeNodeProvider nodeId={nodeId}>
      <div
        data-selected={selected}
        data-expanded={expanded}
        className={clsx(
          classes?.node,
          selected && classes?.nodeSelected,
          expanded && classes?.nodeExpanded,
        )}
      >
        <ControlRenderer nodeId={nodeId} />
        {expanded && (
          <ChildrenRenderer
            nodeId={nodeId}
            offsetHeight={offsetHeight}
            childrenRenderer={childrenRenderer}
            controlRenderer={controlRenderer}
          />
        )}
      </div>
    </TreeNodeProvider>
  );
});
