import { createContext, useContext } from "react";
import type { IAppStartData } from "../../app/IAppStartData.js";

export const AppStartDataContext = createContext<IAppStartData | null>(null);

export function useAppStartData(): IAppStartData {
  const appStartData = useContext(AppStartDataContext);
  if (!appStartData) {
    throw new Error("AppStartData not found");
  }

  return appStartData;
}
