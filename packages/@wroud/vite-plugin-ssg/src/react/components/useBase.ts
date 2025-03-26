import { use } from "react";
import { pathUrlWithBase } from "../pathUrlWithBase.js";
import { SSGContext } from "./SSGContext.js";

export function useBase() {
  const { context } = use(SSGContext)!;

  return (url: string) => pathUrlWithBase(context.base, url);
}
