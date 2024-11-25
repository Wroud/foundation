import { bench } from "vitest";
import "reflect-metadata";
import { container, injectable, Lifecycle } from "tsyringe";

@injectable()
class Service {}
const service = Symbol("singleton");

bench("[tsyringe] singleton", () => {
  const cont = container.createChildContainer();
  cont.register(
    service,
    { useClass: Service },
    { lifecycle: Lifecycle.Singleton },
  );
});

bench("[tsyringe] transient", () => {
  const cont = container.createChildContainer();
  cont.register(
    service,
    { useClass: Service },
    { lifecycle: Lifecycle.Transient },
  );
});

bench("[tsyringe] scoped", () => {
  const cont = container.createChildContainer();
  cont.register(
    service,
    { useClass: Service },
    { lifecycle: Lifecycle.ContainerScoped },
  );
});
