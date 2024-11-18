import type { ILinkDatum } from "./createLinks.js";
import { Layout } from "./Layout.js";

export function getLinkPoints(link: ILinkDatum) {
  const target = link.target;
  const source = link.source;

  const dx = target.x! - source.x!;
  const dy = target.y! - source.y!;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const offsetX = (dx * Layout.node.radius) / distance;
  const offsetY = (dy * Layout.node.radius) / distance;

  return [
    { x: source.x! + offsetX, y: source.y! + offsetY },
    { x: target.x! - offsetX, y: target.y! - offsetY },
  ];
}
