import {
  memo,
  useContext,
  useDeferredValue,
  useMemo,
  type FunctionComponent,
} from "react";
import { TreeDataContext } from "../tree/TreeDataContext.js";
import { NodeSizeCacheContext } from "../viewport/NodeSizeCacheContext.js";
import { NodeRenderer } from "./NodeRenderer.js";
import { TreeVirtualizationContext } from "../viewport/TreeVirtualizationContext.js";
import { TreeClassesContext } from "../tree/TreeClassesContext.js";
import clsx from "clsx";
import { type NodeControlProps } from "./NodeControl.js";

export interface NodeChildrenRendererProps {
  nodeId: string;
  offsetHeight: number;
  root?: boolean;
  childrenRenderer: FunctionComponent<NodeChildrenRendererProps>;
  controlRenderer: FunctionComponent<NodeControlProps>;
}

export const NodeChildren = memo(function NodeChildren({
  nodeId,
  offsetHeight,
  root,
  childrenRenderer,
  controlRenderer,
}: NodeChildrenRendererProps) {
  const data = useContext(TreeDataContext)!;
  const optimization = useContext(TreeVirtualizationContext)!;
  const sizeCache = useContext(NodeSizeCacheContext)!;
  const classes = useContext(TreeClassesContext);

  const children = useMemo(() => data.getChildren(nodeId), [data, nodeId]);

  const childSizes = useMemo(
    () => children.map((child) => sizeCache.getSize(child)),
    [children, sizeCache],
  );

  const totalHeight =
    useMemo(() => sizeCache.getSize(nodeId), [sizeCache, nodeId]) -
    sizeCache.getNodeHeight(nodeId);

  offsetHeight += sizeCache.getNodeHeight(nodeId);

  const viewPortFrom = useDeferredValue(
    optimization.viewPort.from - offsetHeight,
  );
  const viewPortTo = useDeferredValue(optimization.viewPort.to - offsetHeight);

  let offset = 0;
  let i = 0;
  let preFillHeight = 0;
  const visibleElements = [];

  // Fast-forward to first visible child
  for (; i < children.length; i++) {
    const size = childSizes[i] || 0;
    if (offset + size < viewPortFrom) {
      offset += size;
      preFillHeight += size;
    } else {
      break;
    }
  }

  for (; i < children.length; i++) {
    const child = children[i]!;
    const size = childSizes[i] || 0;

    if (offset >= viewPortTo) {
      break;
    }

    visibleElements.push(
      <NodeRenderer
        key={child}
        nodeId={child}
        offsetHeight={offset + offsetHeight}
        childrenRenderer={childrenRenderer}
        controlRenderer={controlRenderer}
      />,
    );
    offset += size;
  }

  return (
    <div
      className={clsx(classes?.children, root && classes?.rootChildren)}
      style={{
        height: totalHeight,
        paddingTop: preFillHeight,
      }}
    >
      {visibleElements}
    </div>
  );
});
