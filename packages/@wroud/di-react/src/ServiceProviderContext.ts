import type { IServiceProvider } from "@wroud/di";
import { createContext } from "react";

export const ServiceProviderContext = createContext<IServiceProvider | null>(
  null,
);
