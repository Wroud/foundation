import type { Selection } from "d3";
import type { IDefs } from "./addDefs.js";

export function createFullScreenSwitch(
  svg: Selection<SVGSVGElement, unknown, null, undefined>,
  defs: IDefs,
) {
  let initialWidthAttr: any = null;
  let initialHeightAttr: any = null;

  const fullScreenSwitch = svg
    .append("g")
    .attr("style", "transform-origin: 100% 0%;")
    .style("cursor", "pointer")
    .on("click", () => {
      if (svg.style("position") === "fixed") {
        svg
          .classed("full-screen", false)
          .style("position", null)
          .style("top", null)
          .style("left", null)
          .style("right", null)
          .style("bottom", null)
          .style("z-index", null)
          .attr("width", initialWidthAttr)
          .attr("height", initialHeightAttr);
      } else {
        initialWidthAttr = svg.attr("width");
        initialHeightAttr = svg.attr("height");
        svg
          .classed("full-screen", true)
          .style("position", "fixed")
          .style("top", 0)
          .style("left", 0)
          .style("right", "0")
          .style("bottom", "0")
          .style("z-index", 9999)
          .attr("width", "100%")
          .attr("height", "100%");
      }
    });

  fullScreenSwitch
    .append("rect")
    .classed("full-screen-background", true)
    .attr("width", 24)
    .attr("height", 24)
    .attr("x", -5)
    .attr("y", -5)
    .attr("rx", 2)
    .attr("ry", 2)
    .attr("fill", "#f9f9f9")
    .attr("stroke", "#ccc")
    .attr("stroke-width", 1);

  fullScreenSwitch.append("title").text("Toggle full screen");

  fullScreenSwitch
    .append("use")
    .classed("full-screen-icon", true)
    .attr("xlink:href", `#${defs.defs.fullScreenSwitch}`);

  return {
    get element() {
      return fullScreenSwitch;
    },
    update() {
      fullScreenSwitch.attr("transform", function () {
        const node = svg.node();
        if (!node) {
          return `translate(0, 0)`;
        }
        const { width, height } = node.getBoundingClientRect();
        const xTranslate = width / 2 - 30;
        const yTranslate = -height / 2 + 20;

        return `translate(${xTranslate}, ${yTranslate})`;
      });
    },
  };
}
