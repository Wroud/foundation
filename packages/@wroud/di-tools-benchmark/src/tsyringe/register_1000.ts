import { bench } from "vitest";
import "reflect-metadata";
import { container, injectable, Lifecycle } from "tsyringe";

const services: { service: any; impl: any }[] = [];

for (let i = 0; i < 1000; i++) {
  @injectable()
  class impl {}
  const service = Symbol("singleton");

  services.push({ service, impl });
}

bench("[tsyringe] singleton", () => {
  const cont = container.createChildContainer();
  for (const { service, impl } of services) {
    cont.register(
      service,
      { useClass: impl },
      { lifecycle: Lifecycle.Singleton },
    );
  }
});

bench("[tsyringe] transient", () => {
  const cont = container.createChildContainer();
  for (const { service, impl } of services) {
    cont.register(
      service,
      { useClass: impl },
      { lifecycle: Lifecycle.Transient },
    );
  }
});

bench("[tsyringe] scoped", () => {
  const cont = container.createChildContainer();
  for (const { service, impl } of services) {
    cont.register(
      service,
      { useClass: impl },
      { lifecycle: Lifecycle.ContainerScoped },
    );
  }
});
