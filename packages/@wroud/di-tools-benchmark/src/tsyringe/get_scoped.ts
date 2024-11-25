import { bench } from "vitest";
import "reflect-metadata";
import { container, scoped, Lifecycle, injectable } from "tsyringe";

@scoped(Lifecycle.ContainerScoped)
@injectable()
class Scoped {}

const scopedContainer = container.createChildContainer();
scopedContainer.resolve(Scoped);
bench("[tsyringe]", () => {
  scopedContainer.resolve(Scoped);
});
