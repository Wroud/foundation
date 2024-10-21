import type { Selection } from "d3";

export interface IDefs {
  element: Selection<SVGDefsElement, unknown, null, undefined>;
  defs: {
    arrowHead: string;
    fullScreenSwitch: string;
  };
}

export function addDefs(
  svg: Selection<SVGSVGElement, unknown, null, undefined>,
): IDefs {
  const defs = svg.append("defs");
  const arrowHead = addArrowHead(defs);
  const fullScreenSwitch = addFullScreenSwitch(defs);

  return {
    element: defs,
    defs: {
      arrowHead,
      fullScreenSwitch,
    },
  };
}

function addArrowHead(
  defs: Selection<SVGDefsElement, unknown, null, undefined>,
) {
  const arrowHeadId = "arrowhead";
  defs
    .append("marker")
    .attr("id", arrowHeadId)
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 10)
    .attr("refY", 0)
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .attr("orient", "auto")
    .append("path")
    .attr("d", "M0,-5L10,0L0,5")
    .attr("fill", "black")
    .classed("arrowhead", true);

  return arrowHeadId;
}

function addFullScreenSwitch(
  defs: Selection<SVGDefsElement, unknown, null, undefined>,
) {
  const fullScreenSwitchId = "fullScreenSwitch";
  defs
    .append("path")
    .attr("id", fullScreenSwitchId)
    .attr(
      "d",
      "M2,9 L0,9 L0,14 L5,14 L5,12 L2,12 L2,9 L2,9 Z M0,5 L2,5 L2,2 L5,2 L5,0 L0,0 L0,5 L0,5 Z M12,12 L9,12 L9,14 L14,14 L14,9 L12,9 L12,12 L12,12 Z M9,0 L9,2 L12,2 L12,5 L14,5 L14,0 L9,0 L9,0 Z",
    );

  return fullScreenSwitchId;
}
