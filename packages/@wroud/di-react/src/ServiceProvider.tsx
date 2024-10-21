import type { IServiceProvider } from "@wroud/di";
import { memo } from "react";
import { ServiceProviderContext } from "./ServiceProviderContext.js";

export interface IServiceProviderProps extends React.PropsWithChildren {
  provider: IServiceProvider;
}

export const ServiceProvider = memo<IServiceProviderProps>(
  function ServiceProvider({ provider, children }) {
    return (
      <ServiceProviderContext.Provider value={provider}>
        {children}
      </ServiceProviderContext.Provider>
    );
  },
);
