import * as d3 from "d3";
import type { IDefs } from "./addDefs.js";
import { type INodeDatum } from "./createNodes.js";
import { Layout } from "./Layout.js";
import type { ILink } from "../IGraph.js";
import { getLinkPoints } from "./getLinkPoints.js";

export type ILinkDatum = /*d3.SimulationLinkDatum<INodeDatum> & */ {
  data: ILink;
  points: Array<{
    x: number;
    y: number;
  }>;
  source: INodeDatum;
  target: INodeDatum;
};

export function createLinks(
  paper: d3.Selection<SVGGElement, unknown, null, undefined>,
  defs: IDefs,
  events?: {
    onHover?: (link: ILinkDatum) => void;
    onBlur?: (link: ILinkDatum) => void;
  },
) {
  let link = paper
    .append("g")
    .classed("links", true)
    .attr("stroke", "#999")
    .selectAll("g")
    .data<ILinkDatum>([]);

  function hoverLink() {
    function entered(event: any, d: any) {
      events?.onHover?.(d);
    }

    function left(event: any, d: any) {
      events?.onBlur?.(d);
    }

    return { entered, left };
  }

  return {
    get links() {
      return link;
    },
    updateData(data: ILinkDatum[]) {
      link = link
        .data<ILinkDatum>(
          data,
          (data) => data.data.source + ":" + data.data.target,
        )
        .join((enter) => {
          const line = enter
            .append("g")
            .call((group) => {
              group
                .append("path")
                .classed("link", true)
                .classed("optional-link", (data) => data.data.optional)
                .attr("opacity", Layout.link.opacity)
                .attr("marker-end", `url(#${defs.defs.arrowHead})`)
                .style("stroke-dasharray", (data) =>
                  data.data.optional ? Layout.linkOptional.dashArray : null,
                );
            })
            .call((group) => {
              group
                .append("path")
                .classed("link-hit-area", true)
                .attr("opacity", 0)
                .attr("stroke-width", 10)
                .call((line) => {
                  line.append("title").text((data) => data.data.name);
                })
                .on("mouseenter", hoverLink().entered)
                .on("mouseleave", hoverLink().left);
            });

          return line;
        });
    },
    update() {
      this.links.each(function update(datum: ILinkDatum) {
        const link = d3
          .select(this)
          .selectAll<SVGPathElement, ILinkDatum>("path");

        if (datum.points.length === 0) {
          datum.points = getLinkPoints(datum);
        }

        link.attr("d", (d) =>
          d3
            .line()
            .x((point) => point[0])
            .y((point) => point[1])
            .curve(d3.curveMonotoneY)(
            d.points.map((p) => [p.x || 0, p.y || 0]),
          ),
        );
      });
    },
    highlight(source: INodeDatum) {
      this.links
        .selectAll<SVGPathElement, ILinkDatum>("path.link")
        .attr("opacity", (o) =>
          o.source === source ? Layout.link.hoverOpacity : Layout.link.opacity,
        );
    },
    highlightLink(link: ILinkDatum) {
      this.links
        .selectAll<SVGPathElement, ILinkDatum>("path.link")
        .attr("opacity", (o) =>
          o === link ? Layout.link.hoverOpacity : Layout.link.opacity,
        );
    },
    resetHighlight() {
      this.links
        .selectAll<SVGPathElement, ILinkDatum>("path.link")
        .attr("opacity", Layout.link.opacity);
    },
  };
}
