import { graphlib, layout } from "@dagrejs/dagre";
import type { INodeDatum } from "./createNodes.js";
import type { ILinkDatum } from "./createLinks.js";
import { Layout } from "./Layout.js";

export function createDagreLayout() {
  return {
    updateData(nodes: INodeDatum[], links: ILinkDatum[]) {
      var graph = new graphlib.Graph({
        compound: true,
        multigraph: true,
        directed: true,
      })
        .setGraph({
          nodesep: 24 * 4 * 2,
          ranksep: 24 * 4 * 2,
        })
        .setDefaultNodeLabel(() => ({
          width: Layout.node.radius * 2,
          height: Layout.node.radius * 2,
        }))
        .setDefaultEdgeLabel(() => ({ weight: 1 }));

      const modules = new Set<string>();
      for (const node of nodes) {
        graph.setNode(node.data.id, {
          ...node,
          width: Layout.node.radius * 2,
          height: Layout.node.radius * 2,
        });
        if (node.data.module) {
          if (!modules.has(node.data.module)) {
            graph.setNode(node.data.module, {
              label: node.data.module,
              name: node.data.module,
            });
            modules.add(node.data.module);
          }
          graph.setParent(node.data.id, node.data.module);
        }
      }
      for (const link of links) {
        graph.setEdge(link.data.source, link.data.target, { ...link });
      }

      layout(graph);

      return {
        getDemensions() {
          return {
            width: graph.graph().width,
            height: graph.graph().height,
          };
        },
        getClusters() {
          return [...modules].map((id) => {
            const node = graph.node(id);

            return {
              name: "module",
              ...node,
              x: node.x - node.width / 2,
              y: node.y - node.height / 2,
            };
          });
        },
        getNode(id: string) {
          return graph.node(id);
        },
        getEdge(source: string, target: string) {
          return graph.edge(source, target);
        },
      };
    },
  };
}
