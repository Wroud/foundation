import "reflect-metadata";
import { bench } from "vitest";
import { Container } from "inversify";
import {
  type ServicePair,
  createServicesTreeInversify,
} from "./tests/createServicesTreeInversify.js";

const singletonServices: ServicePair[] = [];
const rootSingleton = createServicesTreeInversify(8, 1, singletonServices)!;

const transientServices: ServicePair[] = [];
const rootTransient = createServicesTreeInversify(8, 1, transientServices)!;

const scopedServices: ServicePair[] = [];
const rootScoped = createServicesTreeInversify(8, 1, scopedServices)!;

bench(
  "[inversify]",
  () => {
    const myContainer = new Container();
    for (const { service, impl } of singletonServices) {
      myContainer.bind(service).to(impl).inSingletonScope();
    }
    for (const { service, impl } of transientServices) {
      myContainer.bind(service).to(impl).inTransientScope();
    }
    for (const { service, impl } of scopedServices) {
      myContainer.bind(service).to(impl).inRequestScope();
    }

    myContainer.get(rootSingleton.service);
    myContainer.get(rootTransient.service);
    myContainer.get(rootScoped.service);
  },
  {
    time: 5000,
    warmupTime: 1000,
  },
);
