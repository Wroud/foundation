import * as d3 from "d3";
import type { INode } from "../IGraph.js";
import { Layout } from "./Layout.js";
import { ServiceLifetime } from "@wroud/di/di/ServiceLifetime.js";

export type INodeDatum = d3.SimulationNodeDatum & {
  data: INode;
};

export interface INodes {
  nodes: d3.Selection<SVGGElement, INodeDatum, SVGSVGElement, unknown>;
  updateData(data: INodeDatum[]): void;
  update(): void;
}

export function createNodes(
  paper: d3.Selection<SVGGElement, unknown, null, undefined>,
  events?: {
    onHover?: (node: INodeDatum) => void;
    onBlur?: (node: INodeDatum) => void;
    onDragStart?: (node: INodeDatum) => void;
    onDrag?: (node: INodeDatum) => void;
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
      events?.onDrag?.(d);
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

    return d3
      .drag<SVGGElement, INodeDatum>()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  }

  function updateNode(
    node: d3.Selection<SVGGElement, INodeDatum, SVGGElement, unknown>,
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

    node.selectChild("text").each(function (d) {
      const textElement = d3.select(this);
      const maxLength = 30;
      const lineHeight = 1.2;

      const processText = (text: string) => {
        if (text.includes(" ")) {
          const words = text.split(" ");
          const lines = [];
          let currentLine: string = "";

          for (const word of words) {
            if (currentLine.length + word.length + 1 <= maxLength) {
              currentLine += word;
            } else {
              if (currentLine.length > 0) {
                lines.push(currentLine);
              }
              currentLine = word;
            }
          }

          if (currentLine.length) {
            lines.push(currentLine);
          }

          return lines;
        } else {
          return text.length > maxLength
            ? [text.slice(0, maxLength - 3) + "..."]
            : [text];
        }
      };

      const lines = processText(d.data.name);

      textElement.text(null);
      lines.reverse().forEach((line, i) => {
        textElement
          .append("tspan")
          .text(line)
          .attr("x", 0)
          .attr("dy", i === 0 ? -16 : `-${lineHeight}em`);
      });
    });
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
      this.nodes.attr("transform", (d) => `translate(${d.x},${d.y})`);
    },
  };
}
