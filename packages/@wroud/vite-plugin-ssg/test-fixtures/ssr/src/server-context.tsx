"use client";

import { createContext, useContext } from "react";

export interface RequestData {
  greeting: string;
  path: string;
  total: number;
}

const RequestContext = createContext<RequestData>({
  greeting: "",
  path: "",
  total: 0,
});

export function RequestProvider({
  value,
  children,
}: {
  value: RequestData;
  children?: React.ReactNode;
}) {
  return (
    <RequestContext.Provider value={value}>{children}</RequestContext.Provider>
  );
}

export function useRequest(): RequestData {
  return useContext(RequestContext);
}
