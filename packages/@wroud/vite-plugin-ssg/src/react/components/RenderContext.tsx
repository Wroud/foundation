"use client";

import { createContext, useContext, type ReactNode } from "react";

export interface IRenderContext {
  base: string;
  cspNonce?: string;
}

export const RenderContext = createContext<IRenderContext>({
  base: import.meta.env.BASE_URL,
});

export interface RenderContextProviderProps {
  value: IRenderContext;
  children?: ReactNode;
}

export function RenderContextProvider({
  value,
  children,
}: RenderContextProviderProps): ReactNode {
  return <RenderContext value={value}>{children}</RenderContext>;
}

export function useRenderContext(): IRenderContext {
  return useContext(RenderContext);
}
