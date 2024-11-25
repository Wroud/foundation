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

const singletonProvider = new ServiceContainerBuilder()
  .addSingleton(serviceA, implA)
  .build();

singletonProvider.getService(serviceA);

const serviceAResolver = single(serviceA);
bench("[@wroud/di]", () => {
  singletonProvider.getService(serviceAResolver);
});
