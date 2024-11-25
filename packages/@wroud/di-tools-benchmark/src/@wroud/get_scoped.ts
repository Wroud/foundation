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

const scopedProvider = new ServiceContainerBuilder()
  .addScoped(serviceA, implA)
  .build()
  .createScope().serviceProvider;
scopedProvider.getService(serviceA);

const serviceAResolver = single(serviceA);

bench("[@wroud/di]", () => {
  scopedProvider.getService(serviceAResolver);
});
