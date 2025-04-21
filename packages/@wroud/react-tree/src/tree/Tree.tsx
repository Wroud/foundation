import { useMemo } from "react";
import { NodeSizeCacheContext } from "../viewport/NodeSizeCacheContext.js";
import { TreeContext } from "./TreeContext.js";
import { TreeDataContext } from "./TreeDataContext.js";
import type { ITreeProps } from "./ITreeProps.js";
import { NodeChildren } from "../node/NodeChildren.js";
import { useNodeSizeCache } from "../viewport/useNodeSizeCache.js";
import { TreeVirtualizationContext } from "../viewport/TreeVirtualizationContext.js";
import { useTreeViewport } from "../viewport/useTreeViewport.js";
import { TreeClassesContext } from "./TreeClassesContext.js";
import { useClasses } from "./useClasses.js";
import { NodeControl } from "../node/NodeControl.js";

export function Tree({
  tree,
  nodeHeight,
  classes,
  useDefaultClasses = true,
  childrenRenderer,
  controlRenderer,
}: ITreeProps) {
  const { containerRef, viewPort, setViewPort } = useTreeViewport();
  const sizeCache = useNodeSizeCache(nodeHeight, tree.data);
  classes = useClasses(classes, useDefaultClasses);

  const virtualization = useMemo(
    () => ({
      viewPort,
      setViewPort,
    }),
    [viewPort, setViewPort],
  );

  return (
    <TreeContext.Provider value={tree}>
      <TreeDataContext.Provider value={tree.data}>
        <NodeSizeCacheContext.Provider value={sizeCache}>
          <TreeVirtualizationContext.Provider value={virtualization}>
            <TreeClassesContext.Provider value={classes}>
              <div
                ref={containerRef}
                className={classes.root}
                style={{
                  height: "100%",
                  overflow: "auto",
                  position: "relative",
                }}
              >
                <NodeChildren
                  nodeId={tree.data.rootId}
                  offsetHeight={0}
                  root
                  childrenRenderer={childrenRenderer ?? NodeChildren}
                  controlRenderer={controlRenderer ?? NodeControl}
                />
              </div>
            </TreeClassesContext.Provider>
          </TreeVirtualizationContext.Provider>
        </NodeSizeCacheContext.Provider>
      </TreeDataContext.Provider>
    </TreeContext.Provider>
  );
}
