import { useContext, forwardRef } from "react";
import { TreeClassesContext } from "../tree/TreeClassesContext.js";
import type { HTMLAttributes } from "react";
import clsx from "clsx";

interface TreeNodeIconProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const TreeNodeIcon = forwardRef<HTMLDivElement, TreeNodeIconProps>(
  function TreeNodeIcon({ children, className, ...props }, ref) {
    const classes = useContext(TreeClassesContext);

    if (!children) {
      return null;
    }

    return (
      <div ref={ref} {...props} className={clsx(classes.nodeIcon, className)}>
        {children}
      </div>
    );
  },
);
