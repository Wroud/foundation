import "reflect-metadata";
import { bench } from "vitest";
import { Container, token } from "brandi";

class A {}
const serviceASymbol = token("serviceA");

bench("[brandi] singleton", () => {
  const singletonContainer = new Container();
  singletonContainer.bind(serviceASymbol).toInstance(A).inSingletonScope();
});

bench("[brandi] transient", () => {
  const singletonContainer = new Container();
  singletonContainer.bind(serviceASymbol).toInstance(A).inTransientScope();
});

bench("[brandi] scoped", () => {
  const singletonContainer = new Container();
  singletonContainer.bind(serviceASymbol).toInstance(A).inContainerScope();
});
