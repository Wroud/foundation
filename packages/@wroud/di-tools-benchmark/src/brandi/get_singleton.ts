import { bench } from "vitest";
import { Container, token } from "brandi";

class A {}
const singleton = token("serviceA");

const singletonContainer = new Container();
singletonContainer.bind(singleton).toInstance(A).inSingletonScope();
singletonContainer.get(singleton);

bench("[brandi]", () => {
  singletonContainer.get(singleton);
});
