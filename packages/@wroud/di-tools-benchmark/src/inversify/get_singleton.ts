import "reflect-metadata";
import { bench } from "vitest";
import { Container, injectable } from "inversify";

@injectable()
class A {}
const serviceASymbol = Symbol("serviceA");

const singletonContainer = new Container();
singletonContainer.bind(serviceASymbol).to(A).inSingletonScope();
singletonContainer.get(serviceASymbol);

bench("[inversify]", () => {
  singletonContainer.get(serviceASymbol);
});
