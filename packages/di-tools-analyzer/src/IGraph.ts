import type { ServiceLifetime } from "@wroud/di";

export interface INode {
  id: string;
  name: string;
  lifetime: ServiceLifetime;
  notFound?: boolean;
}

export interface ILink {
  source: string;
  target: string;
  name: string;
}

export interface IGraph {
  nodes: INode[];
  links: ILink[];
}
