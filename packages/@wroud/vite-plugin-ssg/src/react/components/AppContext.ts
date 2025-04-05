import { createContext, useContext } from "react";
import type { IAppContext } from "../../app/IAppContext.js";

export const AppContext = createContext<IAppContext | null>(null);

export function useAppContext<T extends IAppContext>(): T {
  const appStartData = useContext(AppContext);
  if (!appStartData) {
    throw new Error("AppStartData not found");
  }

  return appStartData as T;
}
