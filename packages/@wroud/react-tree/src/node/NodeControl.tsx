import { forwardRef, useContext, memo } from "react";
import { TreeDataContext } from "../tree/TreeDataContext.js";
import {
  TreeNodeControl,
  TreeNodeExpand,
  TreeNodeIcon,
  TreeNodeName,
} from "../controls/index.js";

export interface NodeControlProps {
  nodeId: string;
}

export const NodeControl = memo(
  forwardRef<HTMLDivElement, NodeControlProps>(function NodeControl(
    { nodeId },
    ref,
  ) {
    const data = useContext(TreeDataContext)!;
    const node = data.getNode(nodeId);

    return (
      <TreeNodeControl ref={ref}>
        <TreeNodeExpand leaf={node.leaf} />
        {node.icon && (
          <TreeNodeIcon>
            <img src={node.icon} alt={node.name} />
          </TreeNodeIcon>
        )}
        <TreeNodeName title={node.tooltip ?? node.name}>
          {node.name}
        </TreeNodeName>
      </TreeNodeControl>
    );
  }),
);
