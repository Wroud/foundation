import { bench } from "vitest";
import { createService, injectable, ServiceContainerBuilder } from "@wroud/di";

const services: { service: any; impl: any }[] = [];

for (let i = 0; i < 1000; i++) {
  @injectable()
  class impl {}
  const service = createService("service");

  services.push({ service, impl });
}

bench("[@wroud/di] singleton", () => {
  const builder = new ServiceContainerBuilder();
  for (const { service, impl } of services) {
    builder.addSingleton(service, impl);
  }
});

bench("[@wroud/di] transient", () => {
  const builder = new ServiceContainerBuilder();
  for (const { service, impl } of services) {
    builder.addTransient(service, impl);
  }
});

bench("[@wroud/di] scoped", () => {
  const builder = new ServiceContainerBuilder();
  for (const { service, impl } of services) {
    builder.addScoped(service, impl);
  }
});
