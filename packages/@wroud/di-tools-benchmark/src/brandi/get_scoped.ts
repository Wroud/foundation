import { bench } from "vitest";
import { Container, token } from "brandi";

class A {}
const scoped = token("serviceA");

const singletonContainer = new Container();
singletonContainer.bind(scoped).toInstance(A).inContainerScope();

const scopedContainer = new Container().extend(singletonContainer);
scopedContainer.get(scoped);
bench("[brandi]", () => {
  scopedContainer.get(scoped);
});
