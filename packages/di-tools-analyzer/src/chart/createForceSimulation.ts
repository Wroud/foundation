import { forceManyBody, forceSimulation, forceX, forceY } from "d3";

export function createForceSimulation() {
  const simulation = forceSimulation()
    .velocityDecay(0.1)
    .force("charge", forceManyBody().strength(-700).theta(0.1))
    .force("x", forceX().strength(0.1))
    .force("y", forceY().strength(0.1));

  return simulation;
}
