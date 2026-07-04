import { pathUrlWithBase } from "../pathUrlWithBase.js";
import { useRenderContext } from "@wroud/vite-plugin-ssg/react/components/renderContextAccessor";

export function useBase() {
  const renderContext = useRenderContext();
  return (url: string) => pathUrlWithBase(renderContext.base, url);
}
