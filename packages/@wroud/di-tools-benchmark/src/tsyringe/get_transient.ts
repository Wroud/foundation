import { bench } from "vitest";
import "reflect-metadata";
import { container, scoped, Lifecycle, injectable } from "tsyringe";

@scoped(Lifecycle.ResolutionScoped)
@injectable()
class Transient {}

bench("[tsyringe]", () => {
  container.resolve(Transient);
});
