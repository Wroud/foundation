import "reflect-metadata";
import { bench } from "vitest";
import { Container, injectable } from "inversify";

@injectable()
class A {}
const serviceASymbol = Symbol("serviceA");

const container = new Container();
container.bind(serviceASymbol).to(A).inTransientScope();

bench("[inversify]", () => {
  container.get(serviceASymbol);
});
