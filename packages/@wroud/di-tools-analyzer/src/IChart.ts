import type { IGraph } from "./IGraph.js";

export interface IChart {
  update(graph: IGraph): void;
}
