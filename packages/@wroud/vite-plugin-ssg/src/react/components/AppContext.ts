import { createContext, useContext } from "react";
import type { IAppContext } from "../../app/IAppContext.js";

export const AppContext = createContext<IAppContext | null>(null);

export function useAppContext<T extends IAppContext>(): T {
  const appContext = useContext(AppContext);
  if (!appContext) {
    throw new Error("AppContext not found");
  }

  return appContext as T;
}
