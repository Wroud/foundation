import "reflect-metadata";
import { bench } from "vitest";
import { container, Lifecycle } from "tsyringe";
import {
  createServicesTreeTsyringe,
  type ServicePair,
} from "./tests/createServicesTreeTsyringe.js";

const singletonServices: ServicePair[] = [];
const rootSingleton = createServicesTreeTsyringe(8, 1, singletonServices)!;

const transientServices: ServicePair[] = [];
const rootTransient = createServicesTreeTsyringe(8, 1, transientServices)!;

const scopedServices: ServicePair[] = [];
const rootScoped = createServicesTreeTsyringe(8, 1, scopedServices)!;

bench(
  "[tsyringe]",
  () => {
    const cont = container.createChildContainer();

    for (const { service, impl } of singletonServices) {
      cont.register(
        service,
        { useClass: impl },
        { lifecycle: Lifecycle.Singleton },
      );
    }

    for (const { service, impl } of transientServices) {
      cont.register(
        service,
        { useClass: impl },
        { lifecycle: Lifecycle.Transient },
      );
    }

    for (const { service, impl } of scopedServices) {
      cont.register(
        service,
        { useClass: impl },
        { lifecycle: Lifecycle.ContainerScoped },
      );
    }

    cont.resolve(rootSingleton.service);
    cont.resolve(rootTransient.service);
    cont.createChildContainer().resolve(rootScoped.service);
  },
  {
    time: 5000,
    warmupTime: 1000,
  },
);
