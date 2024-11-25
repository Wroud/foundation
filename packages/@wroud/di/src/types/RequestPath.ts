import type { IRequestPathNode } from "./IRequestPathNode.js";
import type { IServiceDescriptor } from "./IServiceDescriptor.js";

export type RequestPath = IRequestPathNode<IServiceDescriptor<any> | null>;
