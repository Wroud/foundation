import { select } from "d3";

export function createSvg(
  svgElement: SVGSVGElement,
  width: string,
  height: string,
  onResize?: () => void,
) {
  const svg = select(svgElement)
    .attr("width", width)
    .attr("height", height)
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr("style", "max-width: 100%;");

  trackSize(svgElement, onResize);

  return svg;
}

function trackSize(svgElement: SVGSVGElement, onUpdated?: () => void) {
  function updateSize() {
    const { width, height } = svgElement.getBoundingClientRect();
    const x = width / 2;
    const y = height / 2;

    svgElement.setAttribute("viewBox", `${-x} ${-y} ${width} ${height}`);
    onUpdated?.();
  }
  const observer = new ResizeObserver(updateSize);
  observer.observe(svgElement);
  updateSize();

  return {
    get size() {
      return svgElement.getBoundingClientRect();
    },
    disconnect() {
      observer.disconnect();
    },
  };
}
