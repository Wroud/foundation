import * as d3 from "d3";

export type IClusterDatum = {
  name: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
};

export interface INodes {
  nodes: d3.Selection<SVGGElement, IClusterDatum, SVGSVGElement, unknown>;
  updateData(data: IClusterDatum[]): void;
  update(): void;
}

export function createClusters(
  paper: d3.Selection<SVGGElement, unknown, null, undefined>,
  events?: {
    onHover?: (node: IClusterDatum) => void;
    onBlur?: (node: IClusterDatum) => void;
    onDragStart?: (node: IClusterDatum) => void;
    onDrag?: (node: IClusterDatum) => void;
    onDragEnd?: (node: IClusterDatum) => void;
  },
) {
  let clusters = paper
    .append("g")
    .attr("stroke", "#999")
    .attr("cursor", "grab")
    .attr("pointer-events", "none")
    .attr("stroke-width", 1.5)
    .selectAll<SVGGElement, IClusterDatum>("g");

  function hoverNode() {
    function entered(event: any, d: any) {
      events?.onHover?.(d);
    }

    function left(event: any, d: any) {
      events?.onBlur?.(d);
    }

    return { entered, left };
  }

  function dragNode() {
    function dragstarted(event: any, d: any) {
      if (!event.active) {
        events?.onDragStart?.(d);
      }
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      events?.onDrag?.(d);
      d.x = event.x;
      d.y = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) {
        events?.onDragEnd?.(d);
      }
      d.fx = null;
      d.fy = null;
    }

    return d3
      .drag<SVGGElement, IClusterDatum>()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  }

  function updateNode(
    cluster: d3.Selection<SVGGElement, IClusterDatum, SVGGElement, unknown>,
  ) {
    cluster.selectChild("title").text((d) => d.name);
    cluster.selectChild("text").text((d) => d.name);
  }

  return {
    get clusters() {
      return clusters;
    },
    updateData(data: IClusterDatum[]) {
      clusters = clusters
        .data(data, (d) => d.name)
        .join(
          (enter) => {
            const node = enter
              .append("g")
              .classed("cluster", true)
              .call(dragNode())
              .on("mouseenter", hoverNode().entered)
              .on("mouseleave", hoverNode().left);

            node.append("rect").attr("fill", "transparent");
            node.append("title");

            node
              .append("text")
              .classed("cluster-text", true)
              .attr("dy", "-16")
              .attr("stroke", "white")
              .attr("paint-order", "stroke")
              .attr("dominant-baseline", "hanging");

            updateNode(node);
            return node;
          },
          (update) => {
            updateNode(update);
            return update;
          },
        );
    },
    update() {
      this.clusters.attr("transform", (d) => `translate(${d.x},${d.y})`);
      this.clusters
        .selectAll<SVGRectElement, IClusterDatum>("rect")
        .attr("width", (d) => d.width || 0)
        .attr("height", (d) => d.height || 0);
    },
  };
}
