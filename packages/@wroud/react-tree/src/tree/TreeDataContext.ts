import { createContext } from "react";

import type { ITreeData } from "./ITreeData.js";

export const TreeDataContext = createContext<ITreeData | null>(null);
