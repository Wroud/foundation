import { select, type Selection } from "d3";
import { Layout } from "./Layout.js";
import type { IDefs } from "./addDefs.js";

export function createLegend(
  svg: Selection<SVGSVGElement, unknown, null, undefined>,
  defs: IDefs,
) {
  // Legend data
  const legendData = [
    { label: "Transient", class: "node-transient" },
    { label: "Scoped", class: "node-scoped" },
    { label: "Singleton", class: "node-singleton" },
    { label: "Not Found", class: "node-not-found" },
    { label: "Dependency", class: "", type: "link" },
    { label: "Optional", class: "optional-link", type: "link" },
  ];

  // Calculate the dimensions for the legend background
  const legendItemHeight = 20;
  const legendWidth = 120;
  const legendHeight = legendData.length * legendItemHeight;

  const legend = svg.append("g").attr("style", "transform-origin: 100% 0%;");

  // Add background for the legend
  legend
    .append("rect")
    .classed("legend-background", true)
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .attr("x", -10)
    .attr("y", -10)
    .attr("rx", 10)
    .attr("ry", 10)
    .attr("fill", "#f9f9f9")
    .attr("stroke", "#ccc")
    .attr("stroke-width", 1);

  // Add legend items
  legend
    .selectAll("g")
    .data(legendData)
    .enter()
    .append("g")
    .classed("legend-item", true)
    .classed("node", true)
    .attr("transform", (d, i) => `translate(0, ${i * 20})`)
    .each(function (d) {
      const g = select(this);
      g.classed(d.class, true);

      if (d.type === "link") {
        g.append("line")
          .classed("link", true)
          .classed(d.class, true)
          .attr("opacity", Layout.link.opacity)
          .attr("marker-end", `url(#${defs.defs.arrowHead})`)
          .style(
            "stroke-dasharray",
            d.class === "optional-link" ? Layout.linkOptional.dashArray : "",
          )
          .attr("x1", -Layout.node.radius)
          .attr("y1", 0)
          .attr("x2", Layout.node.radius * 3)
          .attr("y2", 0);
      } else {
        g.append("circle")
          .attr("r", Layout.node.radius)
          .attr("cx", Layout.node.radius)
          .classed("node-circle", true);
      }

      g.append("text")
        .attr("x", 20)
        .attr("y", 5)
        .text(d.label)
        .classed("node-text", true)
        .attr("stroke", "white")
        .attr("paint-order", "stroke");
    });

  return {
    update() {
      legend.attr("transform", function () {
        const node = svg.node();
        if (!node) {
          return `translate(0, 0)`;
        }
        const { width, height } = node.getBoundingClientRect();
        const xTranslate = -width / 2 + 20;
        const yTranslate = -height / 2 + 20;

        return `translate(${xTranslate}, ${yTranslate})`;
      });
    },
  };
}
