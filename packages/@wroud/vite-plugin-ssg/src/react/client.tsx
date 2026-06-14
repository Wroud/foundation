"use client";

import { StrictMode, type ReactNode } from "react";
import { AppContext } from "./components.js";
import type { IAppContext } from "../app.js";

interface RscAppProps<T extends IAppContext> extends React.PropsWithChildren {
  appStartData: T;
}

export function RscApp<T extends IAppContext>({
  children,
  appStartData,
}: RscAppProps<T>): ReactNode {
  return (
    <StrictMode>
      <AppContext value={appStartData}>{children}</AppContext>
    </StrictMode>
  );
}
