import {
  ServiceLifetime,
  ServiceRegistry,
  type IServiceCollection,
} from "@wroud/di";
import { v4 as uuid } from "uuid";
import type { IGraph, ILink, INode } from "./IGraph.js";
import { getNameOfServiceType } from "@wroud/di/helpers/getNameOfServiceType.js";
import type { IServiceDescriptor } from "@wroud/di/interfaces/IServiceDescriptor.js";
import { loadImplementation } from "./loadImplementation.js";
import { getNameOfDescriptor } from "@wroud/di/helpers/getNameOfDescriptor.js";

export async function getDependenciesGraph(
  serviceCollection: IServiceCollection,
): Promise<IGraph> {
  const nodes: Map<any, INode> = new Map();
  const links: ILink[] = [];

  function addUnknownNode(service: any) {
    const node = nodes.get(service);
    if (!node) {
      const id = uuid();
      const node: INode = {
        id,
        name: getNameOfServiceType(service),
        lifetime: ServiceLifetime.Transient,
        notFound: true,
      };
      nodes.set(service, node);
      return node;
    }
    return node;
  }

  async function addDescriptorNode(
    descriptor: IServiceDescriptor<unknown>,
    notFound?: boolean,
  ) {
    await loadImplementation(descriptor);

    const node = nodes.get(descriptor);
    if (!node) {
      const id = uuid();
      const node: INode = {
        id,
        name: getNameOfDescriptor(descriptor),
        lifetime: descriptor.lifetime,
        notFound,
      };
      nodes.set(descriptor, node);
      return node;
    }
    return node;
  }

  for (const descriptor of serviceCollection) {
    const implementation = await loadImplementation(descriptor);
    const source = await addDescriptorNode(descriptor);

    const dependencies = ServiceRegistry.get(implementation);
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
        const target = await addDescriptorNode(dep);
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
