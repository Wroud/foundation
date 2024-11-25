import "reflect-metadata";
import { bench } from "vitest";
import { Container, token } from "brandi";

class A {}
const transient = token("serviceA");

const container = new Container();
container.bind(transient).toInstance(A).inTransientScope();

bench("[brandi]", () => {
  container.get(transient);
});
