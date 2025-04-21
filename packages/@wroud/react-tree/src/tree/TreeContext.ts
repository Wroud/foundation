import { createContext } from "react";

import type { ITree } from "./ITree.js";

export const TreeContext = createContext<ITree | null>(null);
