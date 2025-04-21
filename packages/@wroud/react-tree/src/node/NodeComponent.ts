import type { FunctionComponent } from "react";
import type { NodeChildrenRendererProps } from "./NodeChildren.js";
import type { NodeControlProps } from "./NodeControl.js";

export interface NodeComponentProps {
  nodeId: string;
  offsetHeight: number;
  childrenRenderer: FunctionComponent<NodeChildrenRendererProps>;
  controlRenderer: FunctionComponent<NodeControlProps>;
}

export type NodeComponent = FunctionComponent<NodeComponentProps>;
