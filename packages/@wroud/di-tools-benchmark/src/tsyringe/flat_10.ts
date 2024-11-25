import { bench } from "vitest";
import "reflect-metadata";
// @ts-ignore
import { container, inject, injectable, Lifecycle } from "tsyringe";

const a0 = "A0";
@injectable()
class A0 {}
const a1 = "A1";
@injectable()
class A1 {}
const a2 = "A2";
@injectable()
class A2 {}
const a3 = "A3";
@injectable()
class A3 {}
const a4 = "A4";
@injectable()
class A4 {}
const a5 = "A5";
@injectable()
class A5 {}
const a6 = "A6";
@injectable()
class A6 {}
const a7 = "A7";
@injectable()
class A7 {}
const a8 = "A8";
@injectable()
class A8 {}
const a9 = "A9";
@injectable()
class A9 {
  constructor(
    // @ts-ignore
    @inject(a0) a0: any,
    // @ts-ignore
    @inject(a1) a1: any,
    // @ts-ignore
    @inject(a2) a2: any,
    // @ts-ignore
    @inject(a3) a3: any,
    // @ts-ignore
    @inject(a4) a4: any,
    // @ts-ignore
    @inject(a5) a5: any,
    // @ts-ignore
    @inject(a6) a6: any,
    // @ts-ignore
    @inject(a7) a7: any,
    // @ts-ignore
    @inject(a8) a8: any,
  ) {}
}

container.register(
  a0,
  {
    useClass: A0,
  },
  { lifecycle: Lifecycle.Transient },
);
container.register(
  a1,
  {
    useClass: A1,
  },
  { lifecycle: Lifecycle.Transient },
);
container.register(
  a2,
  {
    useClass: A2,
  },
  { lifecycle: Lifecycle.Transient },
);
container.register(
  a3,
  {
    useClass: A3,
  },
  { lifecycle: Lifecycle.Transient },
);
container.register(
  a4,
  {
    useClass: A4,
  },
  { lifecycle: Lifecycle.Transient },
);
container.register(
  a5,
  {
    useClass: A5,
  },
  { lifecycle: Lifecycle.Transient },
);
container.register(
  a6,
  {
    useClass: A6,
  },
  { lifecycle: Lifecycle.Transient },
);
container.register(
  a7,
  {
    useClass: A7,
  },
  { lifecycle: Lifecycle.Transient },
);
container.register(
  a8,
  {
    useClass: A8,
  },
  { lifecycle: Lifecycle.Transient },
);
container.register(
  a9,
  {
    useClass: A9,
  },
  { lifecycle: Lifecycle.Transient },
);

bench("[tsyringe]", () => {
  container.resolve(A9);
});
