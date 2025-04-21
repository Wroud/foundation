import { useContext, forwardRef } from "react";
import { TreeContext } from "../tree/TreeContext.js";
import { TreeClassesContext } from "../tree/TreeClassesContext.js";
import { useTreeNode } from "../node/TreeNodeContext.js";
import type { HTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

interface TreeNodeExpandProps extends HTMLAttributes<HTMLDivElement> {
  leaf?: boolean;
  className?: string;
  expandedComponent?: ReactNode;
  collapsedComponent?: ReactNode;
}

export const TreeNodeExpand = forwardRef<HTMLDivElement, TreeNodeExpandProps>(
  function TreeNodeExpand(
    { leaf, className, expandedComponent, collapsedComponent, ...props },
    ref,
  ) {
    const { nodeId, toggle } = useTreeNode();
    const tree = useContext(TreeContext)!;
    const classes = useContext(TreeClassesContext);
    const expanded = tree.isExpanded(nodeId);

    if (leaf) {
      return null;
    }

    return (
      <div
        ref={ref}
        {...props}
        className={clsx(
          classes?.expandControl,
          expanded && classes?.expandControlExpanded,
          className,
        )}
        onClick={toggle}
        data-role="expand-control"
        data-expanded={expanded}
      >
        {expanded ? (expandedComponent ?? "▼") : (collapsedComponent ?? "►")}
      </div>
    );
  },
);
