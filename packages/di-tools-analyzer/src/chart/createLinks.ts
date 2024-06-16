import { select, type Selection } from "d3";
import type { IDefs } from "./addDefs.js";
import { type INodeDatum } from "./createNodes.js";
import { Layout } from "./Layout.js";

export type ILinkDatum = d3.SimulationLinkDatum<INodeDatum>;

export function createLinks(
  paper: Selection<SVGGElement, unknown, null, undefined>,
  defs: IDefs,
) {
  let link = paper
    .append("g")
    .classed("links", true)
    .attr("stroke", "#999")
    .selectAll("line")
    .data<ILinkDatum>([]);

  return {
    get links() {
      return link;
    },
    updateData(data: ILinkDatum[]) {
      link = link
        .data<ILinkDatum>(data, (d) => [d.source, d.target] as any)
        .join((enter) =>
          enter
            .append("line")
            .classed("link", true)
            .attr("opacity", Layout.link.opacity)
            .attr("marker-end", `url(#${defs.defs.arrowHead})`),
        );
    },
    update() {
      this.links.each(function update(datum: ILinkDatum) {
        const link = select(this);
        const target = datum.target as INodeDatum;
        const source = datum.source as INodeDatum;

        const dx = target.x! - source.x!;
        const dy = target.y! - source.y!;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const offsetX = (dx * Layout.node.radius) / distance;
        const offsetY = (dy * Layout.node.radius) / distance;

        link
          .attr("x1", source.x! + offsetX)
          .attr("y1", source.y! + offsetY)
          .attr("x2", target.x! - offsetX)
          .attr("y2", target.y! - offsetY);
      });
    },
    highlight(source: INodeDatum) {
      this.links.attr("opacity", (o) =>
        o.source === source ? Layout.link.hoverOpacity : Layout.link.opacity,
      );
    },
    resetHighlight() {
      this.links.attr("opacity", Layout.link.opacity);
    },
  };
}
