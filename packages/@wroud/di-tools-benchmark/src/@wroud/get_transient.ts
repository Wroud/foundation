import { bench } from "vitest";
import {
  createService,
  injectable,
  ServiceContainerBuilder,
  single,
} from "@wroud/di";

const serviceA = createService("serviceA");
@injectable()
class implA {}

const serviceProvider = new ServiceContainerBuilder()
  .addTransient(serviceA, implA)
  .build();

const serviceAResolver = single(serviceA);
bench("[@wroud/di]", () => {
  serviceProvider.getService(serviceAResolver);
});
