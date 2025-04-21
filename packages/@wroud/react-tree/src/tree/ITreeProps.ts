import type { IReactiveValue } from "@wroud/react-reactive-value";
import type { ITreeClasses } from "./ITreeClasses.js";
import type { FunctionComponent } from "react";
import type { NodeChildrenRendererProps } from "../node/NodeChildren.js";
import type { NodeControlProps } from "../node/NodeControl.js";
import type { ITree } from "./ITree.js";

export interface ITreeProps {
  tree: ITree;
  nodeHeight: IReactiveValue<number, [nodeId: string]>;

  /**
   * Optional custom CSS classes for tree components
   * If not provided, default classes will be used based on useDefaultClasses
   */
  classes?: ITreeClasses;

  /**
   * Whether to use optimized default styles for the tree
   * These styles improve rendering performance while keeping minimal visual styling
   * @default true
   */
  useDefaultClasses?: boolean;

  /**
   * Optional custom renderer for the node children
   */
  childrenRenderer?: FunctionComponent<NodeChildrenRendererProps>;

  /**
   * Optional custom renderer for the node control
   */
  controlRenderer?: FunctionComponent<NodeControlProps>;
}
