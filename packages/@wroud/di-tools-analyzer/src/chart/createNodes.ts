import { drag, type Selection, type SimulationNodeDatum } from "d3";
import type { INode } from "../IGraph.js";
import { Layout } from "./Layout.js";
import { ServiceLifetime } from "@wroud/di/di/ServiceLifetime.js";

export type INodeDatum = SimulationNodeDatum & {
  data: INode;
};

export interface INodes {
  nodes: Selection<SVGGElement, INodeDatum, SVGSVGElement, unknown>;
  updateData(data: INodeDatum[]): void;
  update(): void;
}

export function createNodes(
  paper: Selection<SVGGElement, unknown, null, undefined>,
  events?: {
    onHover?: (node: INodeDatum) => void;
    onBlur?: (node: INodeDatum) => void;
    onDragStart?: (node: INodeDatum) => void;
    onDragEnd?: (node: INodeDatum) => void;
  },
) {
  let nodes = paper
    .append("g")
    .attr("stroke", "#fff")
    .attr("cursor", "grab")
    .attr("stroke-width", 1.5)
    .selectAll<SVGGElement, INodeDatum>("g");

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
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) {
        events?.onDragEnd?.(d);
      }
      d.fx = null;
      d.fy = null;
    }

    return drag<SVGGElement, INodeDatum>()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  }

  function updateNode(
    node: Selection<SVGGElement, INodeDatum, SVGGElement, unknown>,
  ) {
    node
      .classed(
        "node-transient",
        (d) => d.data.lifetime === ServiceLifetime.Transient,
      )
      .classed("node-scoped", (d) => d.data.lifetime === ServiceLifetime.Scoped)
      .classed(
        "node-singleton",
        (d) => d.data.lifetime === ServiceLifetime.Singleton,
      )
      .classed("node-not-found", (d) => d.data.notFound || false);

    node
      .selectChild("circle")
      .attr("fill", (d) => (d.data.notFound ? "#f00" : "#000"));

    node
      .selectChild("title")
      .text((d) => d.data.name + (d.data.notFound ? " (not found)" : ""));

    node.selectChild("text").text((d) => d.data.name);
  }

  return {
    get nodes() {
      return nodes;
    },
    updateData(data: INodeDatum[]) {
      nodes = nodes
        .data(data, (d) => d.data.id)
        .join(
          (enter) => {
            const node = enter
              .append("g")
              .classed("node", true)
              .call(dragNode())
              .on("mouseenter", hoverNode().entered)
              .on("mouseleave", hoverNode().left);

            node
              .append("circle")
              .classed("node-circle", true)
              .attr("r", Layout.node.radius)
              .attr("cx", 0)
              .attr("cy", 0);

            node.append("title");

            node
              .append("text")
              .classed("node-text", true)
              .attr("dy", "-16")
              .attr("text-anchor", "middle")
              .attr("stroke", "white")
              .attr("paint-order", "stroke");

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
      this.nodes.attr("transform", (d) => `translate(${d.x},${d.y})`);
    },
  };
}
