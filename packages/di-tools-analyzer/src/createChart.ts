/// <reference lib="DOM" />
import * as d3 from "d3";
import type { IGraph, INode } from "./IGraph.js";
import { ServiceLifetime } from "@wroud/di";

type NodeDatum = d3.SimulationNodeDatum & INode;
type LinkDatum = d3.SimulationLinkDatum<NodeDatum>;

export function createChart(
  svgElement: SVGSVGElement,
  width: string,
  height: string,
) {
  const CIRCLE_RADIUS = 5;
  const LINK_BASE_OPACITY = 0.3;
  const LINK_HOVER_OPACITY = 1;

  // Legend data
  const legendData = [
    { label: "Transient", class: "node-transient" },
    { label: "Scoped", class: "node-scoped" },
    { label: "Singleton", class: "node-singleton" },
    { label: "Not Found", class: "node-not-found" },
  ];

  const simulation = d3
    .forceSimulation<NodeDatum>()
    .force("charge", d3.forceManyBody().strength(-700))
    .force("x", d3.forceX().strength(0.1))
    .force("y", d3.forceY().strength(0.1))
    .on("tick", ticked);

  const svg = d3
    .select(svgElement)
    .attr("width", width)
    .attr("height", height)
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr("style", "max-width: 100%;")
    .call(function (svg) {
      const node = svg.node();
      if (!node) {
        return;
      }
      const { width, height } = node.getBoundingClientRect();
      const x = width / 2;
      const y = height / 2;

      svg.attr("viewBox", `${-x} ${-y} ${width} ${height}`);
    });

  svg
    .append("defs")
    .append("marker")
    .attr("id", "arrowhead")
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

  let link: d3.Selection<d3.BaseType, LinkDatum, SVGGElement, undefined> = svg
    .append("g")
    .classed("links", true)
    .attr("stroke", "#999")
    .selectAll("line");

  let node: d3.Selection<d3.BaseType, NodeDatum, SVGGElement, unknown> = svg
    .append("g")
    .attr("stroke", "#fff")
    .attr("stroke-width", 1.5)
    .selectAll("g");

  // Calculate the dimensions for the legend background
  const legendItemHeight = 20;
  const legendWidth = 90;
  const legendHeight = legendData.length * legendItemHeight;

  const legend = svg
    .append("g")
    .attr("style", "transform-origin: 100% 0%;")
    .attr("transform", function () {
      const node = svg.node();
      if (!node) {
        return `translate(0, 0)`;
      }
      const { width, height } = node.getBoundingClientRect();
      const xTranslate = width / 2 - legendWidth;
      const yTranslate = -height / 2 + 10;

      return `translate(${xTranslate}, ${yTranslate})`;
    });

  // Add background for the legend
  legend
    .append("rect")
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .attr("x", -10)
    .attr("y", -10)
    .attr("rx", 10)
    .attr("ry", 10)
    .classed("legend-background", true)
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
      const g = d3.select(this);
      g.classed(d.class, true);
      g.append("circle").attr("r", CIRCLE_RADIUS).classed("node-circle", true);

      g.append("text")
        .attr("x", 10)
        .attr("y", 5)
        .text(d.label)
        .classed("node-text", true)
        .attr("stroke", "white")
        .attr("paint-order", "stroke");
    });

  function ticked() {
    node.attr("transform", (d) => `translate(${d.x},${d.y})`);

    link
      .attr("x1", (d) => (d.source as NodeDatum).x!)
      .attr("y1", (d) => (d.source as NodeDatum).y!)
      .attr("x2", (d) => {
        const target = d.target as NodeDatum;
        const source = d.source as NodeDatum;

        const dx = target.x! - source.x!;
        const dy = target.y! - source.y!;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const offsetX = (dx * CIRCLE_RADIUS) / distance;
        return target.x! - offsetX;
      })
      .attr("y2", (d) => {
        const target = d.target as NodeDatum;
        const source = d.source as NodeDatum;

        const dx = target.x! - source.x!;
        const dy = target.y! - source.y!;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const offsetY = (dy * CIRCLE_RADIUS) / distance;
        return target.y! - offsetY;
      });
  }

  function hoverNode() {
    function entered(event: any, d: any) {
      link.attr("opacity", (o) =>
        o.source === d ? LINK_HOVER_OPACITY : LINK_BASE_OPACITY,
      );
    }

    function left(event: any) {
      link.attr("opacity", LINK_BASE_OPACITY);
    }

    return { entered, left };
  }

  function dragNode() {
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return d3
      .drag<SVGGElement, NodeDatum>()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  }

  return {
    update({ nodes, links }: IGraph) {
      // Make a shallow copy to protect against mutation, while
      // recycling old nodes to preserve position and velocity.
      const old = new Map(node.data().map((d) => [d.id, d]));
      nodes = nodes.map((d) => ({ ...old.get(d.id), ...d }));
      links = links.map((d) => ({ ...d }));

      node = node
        .data(nodes, (d) => d.id)
        .join((enter) =>
          enter
            .append("g")
            .classed("node", true)
            .classed(
              "node-transient",
              (d) => d.lifetime === ServiceLifetime.Transient,
            )
            .classed(
              "node-scoped",
              (d) => d.lifetime === ServiceLifetime.Scoped,
            )
            .classed(
              "node-singleton",
              (d) => d.lifetime === ServiceLifetime.Singleton,
            )
            .classed("node-not-found", (d) => d.notFound || false)
            .call(dragNode())
            .on("mouseenter", hoverNode().entered)
            .on("mouseleave", hoverNode().left),
        );

      node
        .append("circle")
        .attr("r", CIRCLE_RADIUS)
        .attr("cx", 0)
        .attr("cy", 0)
        .classed("node-circle", true)
        .attr("fill", (d) => (d.notFound ? "#f00" : "#000"));

      node
        .append("title")
        .text((d) => d.name + (d.notFound ? " (not found)" : ""));

      node
        .append("text")
        .attr("dy", "0.31em")
        .attr("x", 8)
        .attr("text-anchor", "start")
        .text((d) => d.name)
        .classed("node-text", true)
        .attr("stroke", "white")
        .attr("paint-order", "stroke");

      link = link
        .data<LinkDatum>(links, (d) => [d.source, d.target] as any)
        .join("line")
        .classed("link", true)
        .attr("opacity", LINK_BASE_OPACITY)
        .attr("marker-end", "url(#arrowhead)");

      simulation
        .nodes(nodes)
        .force(
          "link",
          d3
            .forceLink<NodeDatum, LinkDatum>(links)
            .id((d) => d.id)
            .distance(50),
        )
        .alpha(1)
        .restart()
        .tick();
    },
  };
}
