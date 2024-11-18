import { zoom, zoomIdentity, type D3ZoomEvent, type Selection } from "d3";

export function createPaper(
  svg: Selection<SVGSVGElement, unknown, null, undefined>,
) {
  const g = svg.append("g");
  // const { width, height } = svg.node()!.getBoundingClientRect();

  const zoomBehavior = zoom<SVGSVGElement, unknown>()
    .extent([
      [0, 0],
      [0, 0],
    ])
    .scaleExtent([0.1, 2])
    .on("zoom", zoomed)
    .filter((event: D3ZoomEvent<SVGGElement, unknown>) => {
      const svgFocused =
        document.activeElement === svg.node() || event.type !== "wheel";
      return svgFocused;
    });

  svg.call(zoomBehavior).attr("tabindex", 0);

  function zoomed({ transform }: D3ZoomEvent<Element, unknown>) {
    g.attr("transform", transform.toString());
  }

  return {
    get element() {
      return g;
    },
    center() {
      const { width, height } = svg.node()!.getBoundingClientRect();
      const x = width / 2;
      const y = height / 2;
      svg
        .transition()
        .call(zoomBehavior.transform, zoomIdentity.translate(x, y));
    },
    translate(x: number, y: number) {
      svg.call(zoomBehavior.translateTo, x, y);
    },
    zoom(scale: number) {
      svg.call(zoomBehavior.scaleTo, scale);
    },
  };
}
