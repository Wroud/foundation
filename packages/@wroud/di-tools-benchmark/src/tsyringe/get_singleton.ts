import { bench } from "vitest";
import "reflect-metadata";
import { container, singleton, injectable } from "tsyringe";

@singleton()
@injectable()
class Singleton {}

container.resolve(Singleton);
bench("[tsyringe]", () => {
  container.resolve(Singleton);
});
