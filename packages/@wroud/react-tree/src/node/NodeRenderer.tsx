import { Node } from "./Node.js";
import type { NodeComponent } from "./NodeComponent.js";

export const NodeRenderer: NodeComponent = function NodeRenderer(props) {
  return <Node {...props} />;
};
