import { bench } from "vitest";
import {
  createService,
  injectable,
  ServiceContainerBuilder,
  single,
} from "@wroud/di";

const a0 = createService("A0");
const a1 = createService("A1");
const a2 = createService("A2");
const a3 = createService("A3");
const a4 = createService("A4");
const a5 = createService("A5");
const a6 = createService("A6");
const a7 = createService("A7");
const a8 = createService("A8");
const a9 = createService("A9");
@injectable(({ single }) => [
  single(a0),
  single(a1),
  single(a2),
  single(a3),
  single(a4),
  single(a5),
  single(a6),
  single(a7),
  single(a8),
])
class A9 {
  constructor(
    a0: any,
    a1: any,
    a2: any,
    a3: any,
    a4: any,
    a5: any,
    a6: any,
    a7: any,
    a8: any,
  ) {}
}

const builder = new ServiceContainerBuilder()
  .addTransient(
    a0,
    @injectable()
    class A0 {},
  )
  .addTransient(
    a1,
    @injectable()
    class A1 {},
  )
  .addTransient(
    a2,
    @injectable()
    class A2 {},
  )
  .addTransient(
    a3,
    @injectable()
    class A3 {},
  )
  .addTransient(
    a4,
    @injectable()
    class A4 {},
  )
  .addTransient(
    a5,
    @injectable()
    class A5 {},
  )
  .addTransient(
    a6,
    @injectable()
    class A6 {},
  )
  .addTransient(
    a7,
    @injectable()
    class A7 {},
  )
  .addTransient(
    a8,
    @injectable()
    class A8 {},
  )
  .addTransient(a9, A9);

const serviceProvider = builder.build();

const a9Resolver = single(a9);
bench("[@wroud/di]", () => {
  serviceProvider.getService(a9Resolver);
});
