import { createContext } from "react";
import type { ITheme } from "../ITheme.js";

export const Theme = createContext<ITheme | null>(null);
