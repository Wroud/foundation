---
outline: deep
---

<script setup>
  const graph = '{"nodes":[{"id":"2af6ba6b-2592-4b54-8ae7-3bc7f9af5e3e","name":"IServiceProvider","lifetime":0},{"id":"77bc5706-9644-47f2-8bdc-a1a0f8bd410e","name":"App","lifetime":0},{"id":"b286dbac-b059-48f8-b64e-35b69c2f1742","name":"DatabaseConnection","lifetime":0},{"id":"325f88be-5ea4-425f-8507-fae1a4204880","name":"GQLServer","lifetime":0},{"id":"f437322b-1361-4a5b-937e-35031ab99959","name":"Request","lifetime":1},{"id":"87161e89-a76d-455d-8d69-5cfd8a07e764","name":"Database","lifetime":2},{"id":"c9f7032a-dfd0-438d-800e-68dfd21358a5","name":"SessionStore","lifetime":2},{"id":"2426bbde-e05f-462b-9cff-d7415e7cd28c","name":"DBUsers","lifetime":2},{"id":"96022475-18a6-4730-b67e-c3b1caa4d378","name":"DBArticles","lifetime":2},{"id":"b7154512-0631-44ab-b909-6595177675d6","name":"DBComments","lifetime":2},{"id":"423c6800-9763-4287-aaa6-c518a284d188","name":"Profile","lifetime":1},{"id":"c9032d6f-3cf1-4cdd-8a85-39c7986a6148","name":"Session","lifetime":1}],"links":[{"source":"77bc5706-9644-47f2-8bdc-a1a0f8bd410e","target":"b286dbac-b059-48f8-b64e-35b69c2f1742","name":"App -> DatabaseConnection"},{"source":"77bc5706-9644-47f2-8bdc-a1a0f8bd410e","target":"325f88be-5ea4-425f-8507-fae1a4204880","name":"App -> GQLServer"},{"source":"325f88be-5ea4-425f-8507-fae1a4204880","target":"f437322b-1361-4a5b-937e-35031ab99959","name":"GQLServer -> Request"},{"source":"87161e89-a76d-455d-8d69-5cfd8a07e764","target":"b286dbac-b059-48f8-b64e-35b69c2f1742","name":"Database -> DatabaseConnection"},{"source":"c9f7032a-dfd0-438d-800e-68dfd21358a5","target":"87161e89-a76d-455d-8d69-5cfd8a07e764","name":"SessionStore -> Database"},{"source":"2426bbde-e05f-462b-9cff-d7415e7cd28c","target":"87161e89-a76d-455d-8d69-5cfd8a07e764","name":"DBUsers -> Database"},{"source":"96022475-18a6-4730-b67e-c3b1caa4d378","target":"87161e89-a76d-455d-8d69-5cfd8a07e764","name":"DBArticles -> Database"},{"source":"b7154512-0631-44ab-b909-6595177675d6","target":"87161e89-a76d-455d-8d69-5cfd8a07e764","name":"DBComments -> Database"},{"source":"423c6800-9763-4287-aaa6-c518a284d188","target":"f437322b-1361-4a5b-937e-35031ab99959","name":"Profile -> Request"},{"source":"423c6800-9763-4287-aaa6-c518a284d188","target":"2426bbde-e05f-462b-9cff-d7415e7cd28c","name":"Profile -> DBUsers"},{"source":"c9032d6f-3cf1-4cdd-8a85-39c7986a6148","target":"f437322b-1361-4a5b-937e-35031ab99959","name":"Session -> Request"},{"source":"c9032d6f-3cf1-4cdd-8a85-39c7986a6148","target":"c9f7032a-dfd0-438d-800e-68dfd21358a5","name":"Session -> SessionStore"}]}';
</script>

# Step-by-Step Guide to Integrate ModuleRegistry into Your Application

Integrating the `ModuleRegistry` class into an existing application can greatly enhance the modularity and scalability of your dependency injection setup. This guide will walk you through the steps to integrate `ModuleRegistry` with a given starting example.

## Starting Example

Let's begin with a sample application that utilizes `@wroud/di` for dependency injection. This example demonstrates how to set up a service container and register various services:

```ts
import { ServiceContainerBuilder, injectable, createService } from "@wroud/di";

@injectable(() => [])
class DatabaseConnection {}
@injectable(() => [DatabaseConnection])
class Database {}
@injectable(() => [Database])
class DBUsers {}
@injectable(() => [Database])
class DBArticles {}
@injectable(() => [Database])
class DBComments {}

@injectable(() => [])
class Request {}
@injectable(() => [Request, DBUsers])
class Profile {}
@injectable(() => [Database])
class SessionStore {}
@injectable(() => [Request, SessionStore])
class Session {}

@injectable(() => [DatabaseConnection, GQLServer])
class App {}
@injectable(() => [Request])
class GQLServer {}

const serviceCollection = new ServiceContainerBuilder()
  .addSingleton(App)
  .addSingleton(DatabaseConnection)
  .addSingleton(GQLServer)
  .addTransient(Database)
  .addTransient(SessionStore)
  .addTransient(DBUsers)
  .addTransient(DBArticles)
  .addTransient(DBComments)
  .addScoped(Request)
  .addScoped(Profile)
  .addScoped(Session);
```

In this example, we have a set of services such as `DatabaseConnection`, `Database`, and `App`, among others. These services are registered in the `ServiceContainerBuilder` with different lifetimes (`singleton`, `transient`, and `scoped`).

<DependenciesGraph
    width="100%"
    height="512"
    :defaultGraph="graph"
  />

## Grouping Dependencies into Modules

To manage these dependencies more efficiently, we can group related services into modules. This approach helps in organizing the code better and simplifies the registration process. Each module will represent a cohesive set of related services.

### Why Grouping Dependencies is Beneficial

1. **Code Organization**: Grouping related services into modules helps in maintaining a clean and organized codebase. It becomes easier to locate, manage, and update services related to a specific functionality.

2. **Scalability**: As your application grows, the number of services and their dependencies can become overwhelming. Grouping services into modules allows you to scale your application more effectively by isolating changes and updates to specific parts of the application.

3. **Reusability**: Modules can be reused across different parts of the application or even in different projects. This promotes code reuse and reduces duplication.

4. **Maintainability**: By grouping services into logical modules, maintaining and updating the code becomes more manageable. Changes to a specific functionality are confined to the respective module, reducing the risk of unintended side effects.

### Method for Grouping Dependencies

We can achieve this by defining modules as collections of related services. Each module will have a unique name and a method to configure the services related to that module. Here are some suggested groupings for the given services:

- **Core Module**: This module can contain core services that are fundamental to the application, such as the main application class, database connection, and any server configurations.

- **Database Module**: This module can group all services related to database interactions, such as the database itself and entities that interact with the database.

- **Session Module**: This module can include services related to user sessions and requests, such as session storage and profile management.

By following this modular approach, you can ensure that your services are well-organized, easily maintainable, and scalable.

## Creating a Module

To create a module, follow these steps:

1. **Group Related Services**: Organize related services by creating a new package for each module if you are using workspaces. This helps in keeping the services that belong to the same module together, making the code more organized and manageable.

2. **Create `module.ts`**: In the package where you have grouped the related services, create a file named `module.ts`. In this file, use `ModuleRegistry.add` to register the module. This will allow the module and its services to be recognized and managed by the `ModuleRegistry`.

3. **Import `module.ts` in `index.ts`**: In the same package, create an `index.ts` file and import `module.ts` to ensure the module is registered when the package is imported.

4. **Add `module.ts` and `index.ts` to "sideEffects"**: To ensure that the module is correctly registered when the package is imported, add `module.ts` and `index.ts` to the `sideEffects` field in your `package.json`. This step ensures that the module registration side effect is executed, allowing the module to be properly integrated into the application.

### Example: Core Module

1. **Group Related Services**: Create a package named `@my/core` and add the core services.

2. **Create `module.ts`**: In the `@my/core` package, create a `module.ts` file:

```ts
import { ModuleRegistry } from "@wroud/di";
import { App } from "./App";
import { GQLServer } from "./GQLServer";

ModuleRegistry.add({
  name: "@my/core",
  async configure(serviceCollection) {
    serviceCollection.addSingleton(App).addSingleton(GQLServer);
  },
});
```

3. **Create `index.ts`**: In the `@my/core` package, create an `index.ts` file and import `module.ts`:

```ts
import "./module.ts";
```

4. **Add `module.ts` and `index.ts` to "sideEffects"**: In your `package.json` of the `@my/core` package, add the paths to `module.ts` and `index.ts`:

```json
{
  "name": "@my/core",
  "version": "1.0.0",
  "main": "index.js",
  "sideEffects": ["./src/module.ts", "./src/index.ts"]
}
```

### Example: Database Module

1. **Group Related Services**: Create a package named `@my/database` and add the database-related services.

2. **Create `module.ts`**: In the `@my/database` package, create a `module.ts` file:

```ts
import { ModuleRegistry } from "@wroud/di";
import { Database } from "./Database";
import { DBUsers } from "./DBUsers";
import { DBArticles } from "./DBArticles";
import { DBComments } from "./DBComments";
import { DatabaseConnection } from "./DatabaseConnection";

ModuleRegistry.add({
  name: "@my/database",
  async configure(serviceCollection) {
    serviceCollection
      .addTransient(Database)
      .addTransient(DBUsers)
      .addTransient(DBArticles)
      .addTransient(DBComments)
      .addSingleton(DatabaseConnection);
  },
});
```

3. **Create `index.ts`**: In the `@my/database` package, create an `index.ts` file and import `module.ts`:

```ts
import "./module.ts";
```

4. **Add `module.ts` and `index.ts` to "sideEffects"**: In your `package.json` of the `@my/database` package, add the paths to `module.ts` and `index.ts`:

```json
{
  "name": "@my/database",
  "version": "1.0.0",
  "main": "index.js",
  "sideEffects": ["./src/module.ts", "./src/index.ts"]
}
```

### Example: Session Module

1. **Group Related Services**: Create a package named `@my/session` and add the session-related services.

2. **Create `module.ts`**: In the `@my/session` package, create a `module.ts` file:

```ts
import { ModuleRegistry } from "@wroud/di";
import { Request } from "./Request";
import { Session } from "./Session";
import { SessionStore } from "./SessionStore";
import { Profile } from "./Profile";

ModuleRegistry.add({
  name: "@my/session",
  async configure(serviceCollection) {
    serviceCollection
      .addTransient(SessionStore)
      .addScoped(Request)
      .addScoped(Profile)
      .addScoped(Session);
  },
});
```

3. **Create `index.ts`**: In the `@my/session` package, create an `index.ts` file and import `module.ts`:

```ts
import "./module.ts";
```

4. **Add `module.ts` and `index.ts` to "sideEffects"**: In your `package.json` of the `@my/session` package, add the paths to `module.ts` and `index.ts`:

```json
{
  "name": "@my/session",
  "version": "1.0.0",
  "main": "index.js",
  "sideEffects": ["./src/module.ts", "./src/index.ts"]
}
```

By following these steps for each module, you can create and register modules in a structured manner, making your application more modular and easier to manage. In the next section, we will discuss how to use the `ModuleRegistry` to configure the service container.

## Initializing the Service Container

Now that we have organized our services into modules and registered them with `ModuleRegistry`, the next step is to create an entry point for our application and use `ServiceContainerBuilder` with `ModuleRegistry` to initialize the service collection.

### Creating the Entry Point

1. **Create an Entry Point File**: Create a new file named `main.ts` or `index.ts` in the root of your application. This file will serve as the entry point for your application.

2. **Initialize ServiceContainerBuilder**: In the entry point file, use `ServiceContainerBuilder` to initialize the service collection. Iterate over the modules registered in `ModuleRegistry` and configure the service collection.

### Example: Entry Point

Here is an example of how to create the entry point and initialize the service collection:

```ts
import { ServiceContainerBuilder, ModuleRegistry } from "@wroud/di";
import { App } from "@my/core";

// Create a new ServiceContainerBuilder instance
const builder = new ServiceContainerBuilder();

// Iterate over the registered modules in ModuleRegistry
for (const module of ModuleRegistry) {
  await module.configure(builder);
}

// Build the service container
const serviceProvider = builder.build();

// Now you can resolve and use your services
const app = serviceProvider.get(App);
app.start();
```

In this example:

1. We create a new instance of `ServiceContainerBuilder`.
2. We iterate over the modules registered in `ModuleRegistry` and call their `configure` method to register their services with the service collection.
3. We build the service container using the `build` method of `ServiceContainerBuilder`.
4. We resolve the `App` service from the service provider and start the application.

By following these steps, you can ensure that all your services are properly registered and configured, and your application is ready to run.

### How It Works

In this setup, modules are registered automatically due to the way we have structured our imports and module initialization:

1. **Automatic Module Registration**: Each module's `module.ts` is imported in the package's main file `index.ts`. This means that whenever anything is imported from these packages, their respective modules are registered automatically.

   For example:

```ts
// @my/core/index.ts
import "./module.ts";
// @my/database/index.ts
import "./module.ts";
// @my/session/index.ts
import "./module.ts";
```

2. **Dependency Chain**: In our example, the `App` class has a dependency on `DatabaseConnection` which causes the `@my/database` module to be registered. Additionally, `App` also depends on `GQLServer`, which in turn depends on `Request`, causing the `@my/session` module to be registered.

   - **Core Module**: We imported `App` in our entry point, which registered `@my/core`.
   - **Database Module**: `App` depends on `DatabaseConnection`, which triggers the registration of `@my/database`.
   - **Session Module**: `App` also has a dependency on `GQLServer`, which depends on `Request`, triggering the registration of `@my/session`.

By importing the main files of each package, we ensure that all necessary modules are registered without explicitly calling their registration code in the entry point. This method simplifies the initialization process and ensures that all dependencies are properly configured.

By following these steps, you can ensure that all your services are properly registered and configured, and your application is ready to run.

## Conclusion

In this guide, we have demonstrated how to integrate the `ModuleRegistry` from `@wroud/di` into an existing application to manage and scale your dependencies effectively. By organizing your services into cohesive modules and using the `ModuleRegistry` to handle their registration, you can achieve a more modular, scalable, and maintainable application architecture.

### Key Takeaways

1. **Modular Organization**: Group related services into modules to maintain a clean and organized codebase.
2. **Automatic Module Registration**: Use `module.ts` and import it in the package's main file (`index.ts`) to ensure modules are registered automatically when the package is imported.
3. **ServiceContainerBuilder Integration**: Initialize the service container by iterating over the registered modules and configuring the service collection using `ServiceContainerBuilder`.
4. **Dependency Chain Management**: Leverage the dependency chain to automatically register necessary modules based on the services' dependencies.

By following these best practices, you can streamline your application's dependency injection setup, making it easier to manage and scale as your application grows. The `ModuleRegistry` provides a robust solution for handling the complexities of dependency management in large-scale applications, ensuring that your services are properly registered and accessible throughout the application lifecycle.
