import { bench } from "vitest";
import "reflect-metadata";
import { container, Lifecycle } from "tsyringe";
import { createDeepServices } from "./tests/createDeepServices.js";

const { lastService, services } = createDeepServices(100);

for (const { service, impl } of services) {
  container.register(
    service,
    { useClass: impl },
    { lifecycle: Lifecycle.Transient },
  );
}

bench("[tsyringe]", () => {
  container.resolve(lastService);
});
