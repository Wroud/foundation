---
outline: deep
---

# API

This article provides an overview of the main API for the `@wroud/di` package. It explains the key classes and functions available for managing dependency injection.

## ServiceContainerBuilder

The `ServiceContainerBuilder` class is used to register services and build the service provider.

### Methods

- **`addSingleton<T>(service: ServiceImplementation<T>): this`**

  - Registers a singleton service to itself.

- **`addSingleton<T>(service: SingleServiceType<T>, factory: IServiceFactory<T>): this`**

  - Registers a singleton service with a factory implementation.

- **`addSingleton<T>(service: SingleServiceType<T>, constructor: IServiceConstructor<T>): this`**

  - Registers a singleton service with a constructor implementation.

- **`addSingleton<T>(service: SingleServiceType<T>, implementation: T): this`**

  - Registers a singleton service with an instance as implementation.

- **`addTransient<T>(service: ServiceImplementation<T>): this`**

  - Registers a transient service.

- **`addTransient<T>(service: SingleServiceType<T>, factory: IServiceFactory<T>): this`**

  - Registers a transient service with a factory implementation.

- **`addTransient<T>(service: SingleServiceType<T>, constructor: IServiceConstructor<T>): this`**

  - Registers a transient service with a constructor implementation.

- **`addScoped<T>(service: ServiceImplementation<T>): this`**

  - Registers a scoped service.

- **`addScoped<T>(service: SingleServiceType<T>, factory: IServiceFactory<T>): this`**

  - Registers a scoped service with a factory implementation.

- **`addScoped<T>(service: SingleServiceType<T>, constructor: IServiceConstructor<T>): this`**

  - Registers a scoped service with a constructor implementation.

- **`build(): IServiceProvider`**
  - Builds and returns the service provider.

### Example

```ts
import { ServiceContainerBuilder } from "@wroud/di";
import Logger from "./Logger";
import ILoggerService from "./ILoggerService";

const builder = new ServiceContainerBuilder();
builder.addSingleton(Logger);
builder.addSingleton(ILoggerService, Logger);
builder.addSingleton(ILoggerService, () => new Logger());

const provider = builder.build();
```

## IServiceProvider

The `IServiceProvider` interface is used to resolve services.

### Methods

- **`getService<T>(service: SingleServiceType<T>): T`**

  - Resolves and returns an instance of the requested service.

- **`getServiceAsync<T>(service: SingleServiceType<T>): Promise<T>`**

  - Resolves and returns an instance of the requested service asynchronously.

- **`getServicesAsync<T>(service: SingleServiceType<T>): Promise<T[]>`**

  - Resolves and returns all instances of the requested service asynchronously.

- **`createScope(): IAsyncServiceScope`**

  - Creates and returns a new scope with `IServiceProvider` and `Symbol.dispose` function.

- **`createAsyncScope(): IServiceScope`**

  - Creates and returns a new scope with `IServiceProvider` and `Symbol.asyncDispose` function.

- **`[Symbol.dispose](): void`**

  - Disposes of the `IServiceProvider` and any services that require disposal.

- **`[Symbol.asyncDispose](): Promise<void>`**
  - Disposes of the `IServiceProvider` and any services that require disposal.

### Example

```ts
import Logger from "./Logger";

const logger = provider.getService(Logger);
logger.log("Hello world!");

const loggers = provider.getServices(Logger);
loggers.forEach((logger) => logger.log("Hello from multiple loggers!"));

const scope = provider.createScope();
const scopedLogger = scope.serviceProvider.getService(Logger);
scopedLogger.log("Scoped Hello world!");

provider.dispose();
```

## lazy

The `lazy` function allows you to define services that are loaded asynchronously, enabling lazy-loading within your application. This function wraps the dynamic `import` statement, ensuring that the service is only loaded when first requested.

### Usage

To use the `lazy` function, wrap your service's dynamic `import` statement within `lazy`, and register the service as usual.

### Example

```ts
import { lazy, ServiceContainerBuilder } from "@wroud/di";
import { IAdministration } from "./Administration/IAdministration";

const builder = new ServiceContainerBuilder();

builder.addSingleton(
  IAdministration,
  lazy(() =>
    import("./Administration/Administration").then((m) => m.Administration),
  ),
);
```

In this example, the `IAdministration` service is registered to be loaded asynchronously. The service will only be resolved when accessed using the `getServiceAsync` or `getServicesAsync` methods of `IServiceProvider`.

## ServiceRegistry

The `ServiceRegistry` class allows registering service metadata such as dependencies.

### Methods

- **`register(service: Class, metadata: IServiceMetadata)`**
  - Registers a service with its metadata.

### Example

```ts
import Logger from "./Logger";

ServiceRegistry.register(Logger, {
  name: "Logger",
  dependencies: [],
});
```

## createService

The `createService` function creates a token that can be used to resolve services.

### Example

```ts
const ILoggerService = createService<ILoggerService>("ILoggerService");
```

## injectable

The `injectable` decorator marks a class as injectable and registers its dependencies.

### Overloads

- `@injectable()`
- `@injectable(() => [Service])`
  - Injects the `Service` implementation as the first argument of a constructor.
- `@injectable(() => [Service, [Service2]])`
  - Injects the `Service` implementation as the first argument of a constructor and an array of `Service2` implementations as the second argument of a constructor.

### Example

```ts
import { injectable } from "@wroud/di";

@injectable()
class Logger {
  log(message: string) {
    console.log(message);
  }
}

@injectable(() => [Logger])
class Service {
  constructor(private readonly logger: Logger) {}

  action() {
    this.logger.log("Action executed");
  }
}

@injectable(() => [Logger, [Service]])
class AnotherService {
  constructor(
    private readonly logger: Logger,
    private readonly services: Service[],
  ) {}

  anotherAction() {
    this.services.forEach((service) => service.action());
    this.logger.log("Another action executed");
  }
}
```

---

This overview provides a quick reference to the main classes and functions in the `@wroud/di` package. For more detailed information, refer to the full documentation.
