import {
  ServiceLifetime,
  ServiceRegistry,
  getNameOfServiceType,
  type IServiceCollection,
  type IServiceDescriptor,
} from "@wroud/di";
import { v4 as uuid } from "uuid";
import type { IGraph, ILink, INode } from "./IGraph.js";

export function getDependenciesGraph(
  serviceCollection: IServiceCollection,
): IGraph {
  const nodes: Map<any, INode> = new Map();
  const links: ILink[] = [];

  function addUnknownNode(service: any) {
    const node = nodes.get(service);
    if (!node) {
      const id = uuid();
      const node = {
        id,
        name: getNameOfServiceType(service) || "Unknown",
        lifetime: ServiceLifetime.Transient,
        notFound: true,
      };
      nodes.set(service, node);
      return node;
    }
    return node;
  }

  function addDescriptorNode(
    descriptor: IServiceDescriptor<unknown>,
    notFound?: boolean,
  ) {
    const node = nodes.get(descriptor);
    if (!node) {
      const id = uuid();
      const node = {
        id,
        name:
          getNameOfServiceType(descriptor.implementation as any) ||
          getNameOfServiceType(descriptor.service),
        lifetime: descriptor.lifetime,
        notFound,
      };
      nodes.set(descriptor, node);
      return node;
    }
    return node;
  }

  for (const descriptor of serviceCollection) {
    const source = addDescriptorNode(descriptor);

    const dependencies = ServiceRegistry.get(descriptor.implementation);
    if (!dependencies) {
      continue;
    }

    for (const dependency of dependencies.dependencies) {
      const service = Array.isArray(dependency) ? dependency[0]! : dependency;

      const descriptors = serviceCollection.getDescriptors(service);
      if (descriptors.length === 0) {
        const target = addUnknownNode(service);
        links.push({
          source: source.id,
          target: target.id,
          name: `${source.name} -> ${target.name}`,
        });
        continue;
      }

      for (const dep of descriptors) {
        const target = addDescriptorNode(dep);
        links.push({
          source: source.id,
          target: target.id,
          name: `${source.name} -> ${target.name}`,
        });
      }
    }
  }

  return { nodes: Array.from(nodes.values()), links };
}
