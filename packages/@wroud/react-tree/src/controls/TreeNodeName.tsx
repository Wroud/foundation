import { useContext, forwardRef } from "react";
import type { ReactNode, HTMLAttributes } from "react";
import { TreeClassesContext } from "../tree/TreeClassesContext.js";
import clsx from "clsx";

interface TreeNodeNameProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  title?: string;
  className?: string;
}

export const TreeNodeName = forwardRef<HTMLDivElement, TreeNodeNameProps>(
  function TreeNodeName({ children, title, className, ...props }, ref) {
    const classes = useContext(TreeClassesContext);

    return (
      <div
        ref={ref}
        {...props}
        className={clsx(classes.nodeContent, className)}
        title={title}
      >
        {children}
      </div>
    );
  },
);
