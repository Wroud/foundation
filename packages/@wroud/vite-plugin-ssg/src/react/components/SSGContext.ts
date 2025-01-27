import { createContext } from "react";
import type { IndexComponentProps } from "../IndexComponent.js";

export const SSGContext = createContext<IndexComponentProps | undefined>(
  undefined,
);
