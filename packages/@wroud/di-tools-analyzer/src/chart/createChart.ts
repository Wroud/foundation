/// <reference lib="DOM" />
import type { IGraph } from "../IGraph.js";
import type { IChart } from "../IChart.js";
import { createSvg } from "./createSvg.js";
import { addDefs } from "./addDefs.js";
import { createLegend } from "./createLegend.js";
import { createLinks, type ILinkDatum } from "./createLinks.js";
import { createNodes, type INodeDatum } from "./createNodes.js";
import { createPaper } from "./createPaper.js";
import { createFullScreenSwitch } from "./createFullScreenSwitch.js";
import { createDagreLayout } from "./createDagreLayout.js";
import { createClusters } from "./createClusters.js";

export function createChart(
  svgElement: SVGSVGElement,
  width: string,
  height: string,
): IChart {
  const resizeSubscribers: Array<() => void> = [];
  const svg = createSvg(svgElement, width, height, () => {
    resizeSubscribers.forEach((fn) => fn());
  });
  const defs = addDefs(svg);

  const paper = createPaper(svg);
  const fullScreenSwitch = createFullScreenSwitch(svg, defs);
  const legend = createLegend(svg, defs);
  resizeSubscribers.push(() => {
    legend.update();
    fullScreenSwitch.update();
  });

  const dagreLayout = createDagreLayout();
  // const forceLayout = createForceLayout({
  //   onTick() {
  //     ticked();
  //   },
  // });

  const clusters = createClusters(paper.element, {});
  const links = createLinks(paper.element, defs, {
    onHover: (link) => links.highlightLink(link),
    onBlur: () => links.resetHighlight(),
  });
  const nodes = createNodes(paper.element, {
    onHover: (node) => links.highlight(node),
    onBlur: () => links.resetHighlight(),
    onDragStart: () => {
      // forceLayout.start();
      ticked();
    },
    onDrag: () => {
      ticked();
    },
    onDragEnd: () => {
      // forceLayout.stop();
      ticked();
    },
  });

  function ticked() {
    nodes.update();
    links.update();
  }

  return {
    update(graph: IGraph) {
      // Make a shallow copy to protect against mutation, while
      // recycling old nodes to preserve position and velocity.
      const oldNodes = new Map(nodes.nodes.data().map((d) => [d.data.id, d]));
      const oldLinks = new Map(
        links.links.data().map((d) => [d.data.source + ":" + d.data.target, d]),
      );

      const nodesData = graph.nodes.map<INodeDatum>((d) => ({
        ...oldNodes.get(d.id),
        data: d,
      }));
      const linksData = graph.links.map<ILinkDatum>((d) => ({
        ...oldLinks.get(d.source + ":" + d.target),
        data: d,
        points: [],
        source: nodesData.find((n) => n.data.id === d.source)!,
        target: nodesData.find((n) => n.data.id === d.target)!,
      }));

      const layout = dagreLayout.updateData(nodesData, linksData);
      // forceLayout.updateData(nodesData, linksData);

      const { width, height } = layout.getDemensions();

      if (width && height) {
        paper.translate(width / 2, height / 2);
        paper.zoom(0.8);
      }

      for (const node of nodesData) {
        const { x, y } = layout.getNode(node.data.id);
        node.x = x;
        node.y = y;
      }

      for (const link of linksData) {
        const { points } = layout.getEdge(link.data.source, link.data.target);
        link.points = points.map(({ x, y }: any) => ({ x, y }));
      }

      nodes.updateData(nodesData);
      links.updateData(linksData);
      clusters.updateData(layout.getClusters());

      nodes.update();
      links.update();
      clusters.update();
    },
  };
}
