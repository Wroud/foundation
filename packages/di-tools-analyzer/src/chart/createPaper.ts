import { zoom, type D3ZoomEvent, type Selection } from "d3";

export function createPaper(
  svg: Selection<SVGSVGElement, unknown, null, undefined>,
) {
  const g = svg.append("g");
  // const { width, height } = svg.node()!.getBoundingClientRect();

  svg.call(
    zoom<SVGSVGElement, unknown>()
      .extent([
        [0, 0],
        [0, 0],
        // [width, height],
      ])
      .scaleExtent([0.1, 2])
      .on("zoom", zoomed)
      .filter((event) => {
        const svgFocused = document.activeElement === svg.node();
        return svgFocused;
      }),
  );

  svg.attr("tabindex", 0);

  function zoomed({ transform }: D3ZoomEvent<Element, unknown>) {
    g.attr("transform", transform.toString());
  }

  return {
    get element() {
      return g;
    },
  };
}
