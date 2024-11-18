import { type IServiceCollection } from "@wroud/di";
import { v4 as uuid } from "uuid";
import type { IGraph, ILink, INode } from "./IGraph.js";
import { getNameOfServiceType } from "@wroud/di/helpers/getNameOfServiceType.js";
import type { IServiceDescriptor } from "@wroud/di/types";
import { getDeps } from "./loadImplementation.js";
import { getNameOfDescriptor } from "@wroud/di/helpers/getNameOfDescriptor.js";
import { ServiceLifetime } from "@wroud/di/di/ServiceLifetime.js";
import { getServiceTypeFromDependency } from "@wroud/di/helpers/getServiceTypeFromDependency.js";
import { isOptionalDependency } from "./isOptionalDependency.js";
import type { ServiceCollectionProxy } from "./ServiceCollectionProxy.js";

export async function getDependenciesGraph(
  serviceCollection: IServiceCollection,
  proxy?: ServiceCollectionProxy,
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

  async function addDescriptorNode(descriptor: IServiceDescriptor<unknown>) {
    await getDeps(descriptor);

    const node = nodes.get(descriptor);
    if (!node) {
      const id = uuid();
      const node: INode = {
        id,
        name: getNameOfDescriptor(descriptor),
        lifetime: descriptor.lifetime,
      };
      const module = proxy?.getModules().get(descriptor);

      if (module) {
        node.module = module;
      }
      nodes.set(descriptor, node);
      return node;
    }
    return node;
  }

  for (const descriptor of serviceCollection) {
    const deps = await getDeps(descriptor);
    const source = await addDescriptorNode(descriptor);

    for (const dependency of deps) {
      const service = getServiceTypeFromDependency(dependency);

      const descriptors = serviceCollection.getDescriptors(service);
      if (descriptors.length === 0) {
        const target = addUnknownNode(service);
        links.push({
          source: source.id,
          target: target.id,
          name: `${source.name} -> ${target.name}`,
          optional: isOptionalDependency(dependency),
        });
        continue;
      }

      for (const dep of descriptors) {
        if (dep === descriptor) {
          continue;
        }
        const target = await addDescriptorNode(dep);
        links.push({
          source: source.id,
          target: target.id,
          name: `${source.name} -> ${target.name}`,
          optional: isOptionalDependency(dependency),
        });
      }
    }
  }

  return { nodes: Array.from(nodes.values()), links };
}
