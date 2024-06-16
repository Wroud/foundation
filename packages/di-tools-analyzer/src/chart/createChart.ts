/// <reference lib="DOM" />
import type { IGraph } from "../IGraph.js";
import type { IChart } from "../IChart.js";
import { forceLink } from "d3";
import { createSvg } from "./createSvg.js";
import { addDefs } from "./addDefs.js";
import { createForceSimulation } from "./createForceSimulation.js";
import { createLegend } from "./createLegend.js";
import { createLinks, type ILinkDatum } from "./createLinks.js";
import { createNodes, type INodeDatum } from "./createNodes.js";
import { createPaper } from "./createPaper.js";
import { createFullScreenSwitch } from "./createFullScreenSwitch.js";

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
  const legend = createLegend(svg);
  resizeSubscribers.push(() => {
    legend.update();
    fullScreenSwitch.update();
  });

  const simulation = createForceSimulation().on("tick", ticked);

  const links = createLinks(paper.element, defs);
  const nodes = createNodes(paper.element, {
    onHover: (node) => links.highlight(node),
    onBlur: () => links.resetHighlight(),
    onDragStart: () => {
      simulation.alphaTarget(0.3).restart();
    },
    onDragEnd: () => {
      simulation.alphaTarget(0);
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
      const old = new Map(nodes.nodes.data().map((d) => [d.data.id, d]));
      const nodesData = graph.nodes.map((d) => ({ ...old.get(d.id), data: d }));
      const linksData = graph.links.map((d) => ({ ...d }));

      nodes.updateData(nodesData);
      links.updateData(linksData);

      simulation
        .nodes(nodesData)
        .force(
          "link",
          forceLink<INodeDatum, ILinkDatum>(linksData)
            .id((d) => d.data.id)
            .distance(50)
            .strength(0.4),
        )
        .alpha(1)
        .restart()
        .tick();
    },
  };
}
