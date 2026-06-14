"use client";

import { createContext, useContext } from "react";

const ServerDataContext = createContext<string | undefined>(undefined);

export function ServerDataProvider({
  value,
  children,
}: {
  value: string;
  children?: React.ReactNode;
}) {
  return (
    <ServerDataContext.Provider value={value}>
      {children}
    </ServerDataContext.Provider>
  );
}

export function useServerData() {
  return useContext(ServerDataContext);
}
