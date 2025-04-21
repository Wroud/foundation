import { forwardRef, useContext } from "react";
import type { HTMLAttributes } from "react";
import { TreeClassesContext } from "../tree/TreeClassesContext.js";
import { useTreeNode } from "../node/TreeNodeContext.js";
import clsx from "clsx";
import { NodeSizeCacheContext } from "../viewport/NodeSizeCacheContext.js";

export interface TreeNodeControlProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onClick"> {
  className?: string;
}

export const TreeNodeControl = forwardRef<HTMLDivElement, TreeNodeControlProps>(
  function TreeNodeControl({ className, children, style, ...props }, ref) {
    const classes = useContext(TreeClassesContext);
    const { nodeId, click } = useTreeNode();
    const sizeCache = useContext(NodeSizeCacheContext)!;
    const height = sizeCache.getNodeHeight(nodeId);

    return (
      <div
        ref={ref}
        {...props}
        style={{ height, ...style }}
        onClick={click}
        className={clsx(classes.nodeControl, className)}
      >
        {children}
      </div>
    );
  },
);
