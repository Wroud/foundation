import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDependenciesGraph } from "./getDependenciesGraph.js";
import { mockSyncServicesCollection } from "./tests/mockSyncServicesCollection.js";
import { mockAsyncServicesCollection } from "./tests/mockAsyncServicesCollection.js";

const mockImpl = vi.hoisted(() => {
  let id = 0;
  return {
    reset: () => {
      id = 0;
    },
    v4: () => {
      return `uuid-${id++}`;
    },
  };
});

vi.mock(import("uuid"), () => mockImpl as any);

describe.sequential("injectable", () => {
  beforeEach(() => {
    mockImpl.reset();
  });

  it("should be defined", () => {
    expect(getDependenciesGraph).toBeDefined();
  });

  it.sequential(
    "should make graph for sync services implementations",
    async () => {
      const servicesCollection = mockSyncServicesCollection();
      const graph = await getDependenciesGraph(servicesCollection);

      expect(graph).toBeDefined();
      expect(graph.nodes).toBeDefined();
      expect(graph.links).toBeDefined();
      expect(
        graph.nodes.sort((a, b) => a.name.localeCompare(b.name)),
      ).toMatchSnapshot();
      expect(graph.links).toMatchSnapshot();
    },
  );

  it.sequential(
    "should make graph for async services implementations",
    async () => {
      const servicesCollection = mockAsyncServicesCollection();
      const graph = await getDependenciesGraph(servicesCollection);

      expect(graph).toBeDefined();
      expect(graph.nodes).toBeDefined();
      expect(graph.links).toBeDefined();
      expect(
        graph.nodes.sort((a, b) => a.name.localeCompare(b.name)),
      ).toMatchSnapshot();
      expect(graph.links).toMatchSnapshot();
    },
  );
});
