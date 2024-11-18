import * as d3 from "d3";
import { createForceSimulation } from "./createForceSimulation.js";
import type { INodeDatum } from "./createNodes.js";
import type { ILinkDatum } from "./createLinks.js";

interface IOptions {
  onTick?: () => void;
}

export function createForceLayout({ onTick }: IOptions) {
  const simulation = createForceSimulation().on("tick", () => onTick?.());

  return {
    updateData(nodes: INodeDatum[], links: ILinkDatum[]) {
      simulation
        .nodes(nodes)
        .force(
          "link",
          d3
            .forceLink<INodeDatum, ILinkDatum>(links)
            .id((d) => d.data.id)
            .distance(50)
            .strength(0.4),
        )
        .alpha(1)
        .restart()
        .tick();
    },
    start() {
      simulation.alphaTarget(0.3).restart();
    },
    stop() {
      simulation.alphaTarget(0);
    },
  };
}
