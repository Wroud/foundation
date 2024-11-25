import { bench } from "vitest";
import { Container } from "brandi";
import {
  createServicesTreeBrandi,
  type ServicePair,
} from "./tools/createServicesTreeBrandi.js";

const singletonServices: ServicePair[] = [];
const rootSingleton = createServicesTreeBrandi(8, 1, singletonServices)!;

const transientServices: ServicePair[] = [];
const rootTransient = createServicesTreeBrandi(8, 1, transientServices)!;

const scopedServices: ServicePair[] = [];
const rootScoped = createServicesTreeBrandi(8, 1, scopedServices)!;

bench(
  "[brandi]",
  () => {
    const myContainer = new Container();
    for (const { service, impl } of singletonServices) {
      myContainer.bind(service).toInstance(impl).inSingletonScope();
    }
    for (const { service, impl } of transientServices) {
      myContainer.bind(service).toInstance(impl).inTransientScope();
    }
    for (const { service, impl } of scopedServices) {
      myContainer.bind(service).toInstance(impl).inContainerScope();
    }

    myContainer.get(rootSingleton.service);
    myContainer.get(rootTransient.service);
    new Container().extend(myContainer).get(rootScoped.service);
  },
  {
    time: 5000,
    warmupTime: 1000,
  },
);
