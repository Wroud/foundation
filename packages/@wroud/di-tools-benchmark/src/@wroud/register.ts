import { bench } from "vitest";
import { createService, injectable, ServiceContainerBuilder } from "@wroud/di";

const service = createService("service");
@injectable()
class impl {}

bench("[@wroud/di] singleton", () => {
  const builder = new ServiceContainerBuilder();
  builder.addSingleton(service, impl);
});

bench("[@wroud/di] transient", () => {
  const builder = new ServiceContainerBuilder();
  builder.addTransient(service, impl);
});

bench("[@wroud/di] scoped", () => {
  const builder = new ServiceContainerBuilder();
  builder.addScoped(service, impl);
});
