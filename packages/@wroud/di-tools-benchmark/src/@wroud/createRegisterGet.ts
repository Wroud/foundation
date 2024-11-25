import { bench } from "vitest";
import { ServiceContainerBuilder, single } from "@wroud/di";
import {
  createServicesTreeWroudDi,
  type ServicePair,
} from "./tests/createServicesTreeWroudDi.js";

const singletonServices: ServicePair[] = [];
const rootSingleton = createServicesTreeWroudDi(8, 1, singletonServices)!;

const transientServices: ServicePair[] = [];
const rootTransient = createServicesTreeWroudDi(8, 1, transientServices)!;

const scopedServices: ServicePair[] = [];
const rootScoped = createServicesTreeWroudDi(8, 1, scopedServices)!;

const builder = new ServiceContainerBuilder();

for (const { service, impl } of singletonServices) {
  builder.addSingleton(service, impl);
}

for (const { service, impl } of transientServices) {
  builder.addTransient(service, impl);
}

for (const { service, impl } of scopedServices) {
  builder.addScoped(service, impl);
}

const singletonResolver = single(rootSingleton.service);
const transientResolver = single(rootTransient.service);
const scopedResolver = single(rootScoped.service);

bench(
  "[@wroud/di]",
  () => {
    const serviceProvider = builder.build();
    serviceProvider.getService(singletonResolver);
    serviceProvider.getService(transientResolver);
    serviceProvider.createScope().serviceProvider.getService(scopedResolver);
  },
  {
    time: 5000,
    warmupTime: 1000,
  },
);
