import "reflect-metadata";
import { bench } from "vitest";
import { Container, injectable } from "inversify";

@injectable()
class A {}
const serviceASymbol = Symbol("serviceA");

bench("[inversify] singleton", () => {
  const singletonContainer = new Container();
  singletonContainer.bind(serviceASymbol).to(A).inSingletonScope();
});

bench("[inversify] transient", () => {
  const singletonContainer = new Container();
  singletonContainer.bind(serviceASymbol).to(A).inTransientScope();
});

bench("[inversify] scoped", () => {
  const singletonContainer = new Container();
  singletonContainer.bind(serviceASymbol).to(A).inRequestScope();
});
