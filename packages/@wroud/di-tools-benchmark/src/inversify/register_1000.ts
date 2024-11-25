import "reflect-metadata";
import { bench } from "vitest";
import { Container, injectable } from "inversify";

const services: { service: any; impl: any }[] = [];

for (let i = 0; i < 1000; i++) {
  @injectable()
  class impl {}
  const service = Symbol("serviceA");

  services.push({ service, impl });
}

bench("[inversify] singleton", () => {
  const singletonContainer = new Container();

  for (const { service, impl } of services) {
    singletonContainer.bind(service).to(impl).inSingletonScope();
  }
});

bench("[inversify] transient", () => {
  const singletonContainer = new Container();
  for (const { service, impl } of services) {
    singletonContainer.bind(service).to(impl).inTransientScope();
  }
});

bench("[inversify] scoped", () => {
  const singletonContainer = new Container();
  for (const { service, impl } of services) {
    singletonContainer.bind(service).to(impl).inRequestScope();
  }
});
