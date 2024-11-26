import { bench } from "vitest";
import { ServiceContainerBuilder } from "@wroud/di";
import { createDeepServices } from "./tests/createDeepServices.js";

const { lastService, services } = createDeepServices(500);

const builder = new ServiceContainerBuilder();

for (const { service, impl } of services) {
  builder.addTransient(service, impl);
}

const serviceProvider = builder.build();

bench("[@wroud/di]", () => {
  serviceProvider.getService(lastService);
});
