import { createContext } from "react";

import type { INodeSizeCache } from "./useNodeSizeCache.js";

export const NodeSizeCacheContext = createContext<INodeSizeCache | null>(null);
