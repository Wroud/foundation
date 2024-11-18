import type { ServiceLifetime } from "@wroud/di/di/ServiceLifetime.js";

export interface INode {
  id: string;
  name: string;
  lifetime: ServiceLifetime;
  module?: string;
  notFound?: boolean;
}

export interface ILink {
  source: string;
  target: string;
  name: string;
  optional: boolean;
}

export interface IGraph {
  nodes: INode[];
  links: ILink[];
}
