"use client";

import { pathUrlWithBase } from "../pathUrlWithBase.js";
import { useRenderContext } from "./RenderContext.js";

export function useBase() {
  const renderContext = useRenderContext();
  return (url: string) => pathUrlWithBase(renderContext.base, url);
}
