import { createContext } from "react";

export interface IViewPort {
  from: number;
  to: number;
}

export interface ITreeVirtualization {
  viewPort: IViewPort;
  setViewPort(viewport: IViewPort): void;
}

export const TreeVirtualizationContext =
  createContext<ITreeVirtualization | null>(null);
