import "reflect-metadata";
import { bench } from "vitest";
import { Container } from "inversify";
import { createDeepServices } from "./tests/createDeepServices.js";

const { lastService, services } = createDeepServices(10);

const container = new Container();
for (const { service, impl } of services) {
  container.bind(service).to(impl).inTransientScope();
}

bench("[inversify]", () => {
  container.get(lastService);
});
