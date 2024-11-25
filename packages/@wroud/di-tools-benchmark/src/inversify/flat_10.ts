import "reflect-metadata";
import { bench } from "vitest";
import { Container, inject, injectable } from "inversify";

const a0 = Symbol("A0");
@injectable()
class A0 {}
const a1 = Symbol("A1");
@injectable()
class A1 {}
const a2 = Symbol("A2");
@injectable()
class A2 {}
const a3 = Symbol("A3");
@injectable()
class A3 {}
const a4 = Symbol("A4");
@injectable()
class A4 {}
const a5 = Symbol("A5");
@injectable()
class A5 {}
const a6 = Symbol("A6");
@injectable()
class A6 {}
const a7 = Symbol("A7");
@injectable()
class A7 {}
const a8 = Symbol("A8");
@injectable()
class A8 {}
@injectable()
class A9 {
  //@ts-ignore
  @inject(a0) private a0: any;
  //@ts-ignore
  @inject(a1) private a1: any;
  //@ts-ignore
  @inject(a2) private a2: any;
  //@ts-ignore
  @inject(a3) private a3: any;
  //@ts-ignore
  @inject(a4) private a4: any;
  //@ts-ignore
  @inject(a5) private a5: any;
  //@ts-ignore
  @inject(a6) private a6: any;
  //@ts-ignore
  @inject(a7) private a7: any;
  //@ts-ignore
  @inject(a8) private a8: any;
}
const a9 = Symbol("A9");

const container = new Container();
container.bind(a0).to(A0).inTransientScope();
container.bind(a1).to(A1).inTransientScope();
container.bind(a2).to(A2).inTransientScope();
container.bind(a3).to(A3).inTransientScope();
container.bind(a4).to(A4).inTransientScope();
container.bind(a5).to(A5).inTransientScope();
container.bind(a6).to(A6).inTransientScope();
container.bind(a7).to(A7).inTransientScope();
container.bind(a8).to(A8).inTransientScope();
container.bind(a9).to(A9).inTransientScope();

bench("[inversify]", () => {
  container.get(a9);
});
