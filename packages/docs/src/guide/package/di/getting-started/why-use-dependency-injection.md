# Why Use Dependency Injection?

## Introduction

In this guide, we will explore how Dependency Injection (DI) can address various challenges in software development. We will discuss the advantages of using @wroud/di and identify scenarios where DI is particularly beneficial. Through step-by-step examples, we will demonstrate the practical benefits and efficiency gains achieved by implementing DI in your applications. Learn how DI can improve your code structure, enhance testability, and manage dependencies more effectively.

## Example 1: Base Application

We'll start with a simple example to understand the structure and then evolve it step-by-step.

### Initial Code

```typescript
class App {
  constructor(
    private logger: Logger,
    private database: Database,
  ) {}
  start() {
    this.database.connect();
    this.logger.log("started");
  }
  stop() {
    this.database.disconnect();
    this.logger.log("stopped");
  }
}

class Database {
  constructor(private logger: Logger) {}
  connect() {
    this.logger.log("connected");
  }
  disconnect() {
    this.logger.log("disconnected");
  }
}

class Logger {
  log(message: string) {
    console.log(message);
  }
}
```

In this basic example, we have an `App` class that depends on a `Logger` and a `Database`. The `Database` also depends on the `Logger`. This setup shows how the `App` starts and stops by connecting and disconnecting the database and logging these events.

### Initialization Variant 1

```typescript
const logger = new Logger();
const database = new Database(logger);
const app = new App(logger, database);
app.start();
app.stop();
```

In this initialization variant, we manually create instances of `Logger` and `Database` and pass them to the `App` constructor. This approach works but can become cumbersome as the application grows.

### Initialization Variant 2

```typescript
class App {
  private logger: Logger;
  private database: Database;
  constructor() {
    this.logger = new Logger();
    this.database = new Database(this.logger);
  }
  start() {
    this.database.connect();
    this.logger.log("started");
  }
  stop() {
    this.database.disconnect();
    this.logger.log("stopped");
  }
}

const app = new App();
app.start();
app.stop();
```

In this variant, the `App` class creates its own dependencies internally. While this approach centralizes the creation of dependencies within the `App` class, it reduces flexibility and makes it harder to manage dependencies in a larger application.

## Example 2: Expanding the Base Application

Now, let's expand our base application by adding more classes and see how the initialization changes.

### Expanded Application Code

```typescript
class App {
  constructor(
    private logger: Logger,
    private database: Database,
  ) {}
  start() {
    this.database.connect();
    this.logger.log("started");
  }
  stop() {
    this.database.disconnect();
    this.logger.log("stopped");
  }
}

class Database {
  constructor(private logger: Logger) {}
  connect() {
    this.logger.log("connected");
  }
  disconnect() {
    this.logger.log("disconnected");
  }
  query() {
    this.logger.log("queried");
  }
}

class Logger {
  log(message: string) {
    console.log(message);
  }
}

class UsersManager {
  constructor(
    private logger: Logger,
    private database: Database,
  ) {}
  addUser() {
    this.database.query();
    this.logger.log("added user");
  }
}

class RegistrationService {
  constructor(
    private logger: Logger,
    private usersManager: UsersManager,
  ) {}
  registerUser() {
    this.usersManager.addUser();
    this.logger.log("registered user");
  }
}
```

In this expanded version, we added `UsersManager` and `RegistrationService` classes. These new classes also depend on `Logger` and `Database`.

### Initialization Variant 1

```typescript
const logger = new Logger();
const database = new Database(logger);
const usersManager = new UsersManager(logger, database);
const registrationService = new RegistrationService(logger, usersManager);
const app = new App(logger, database);
app.start();
registrationService.registerUser();
app.stop();
```

This variant demonstrates the manual creation of instances for all new classes. As the application grows, this approach quickly becomes tedious and error-prone due to the manual wiring of dependencies.

### Initialization Variant 2

```typescript
class App {
  private logger: Logger;
  readonly database: Database;
  constructor() {
    this.logger = new Logger();
    this.database = new Database(this.logger);
  }
  start() {
    this.database.connect();
    this.logger.log("started");
  }
  stop() {
    this.database.disconnect();
    this.logger.log("stopped");
  }
}

class Database {
  readonly usersManager: UsersManager;
  constructor(private logger: Logger) {
    this.usersManager = new UsersManager(logger, this);
  }
  connect() {
    this.logger.log("connected");
  }
  disconnect() {
    this.logger.log("disconnected");
  }
  query() {
    this.logger.log("queried");
  }
}

class Logger {
  log(message: string) {
    console.log(message);
  }
}

class UsersManager {
  readonly registrationService: RegistrationService;
  constructor(
    private logger: Logger,
    private database: Database,
  ) {
    this.registrationService = new RegistrationService(logger, this);
  }
  addUser() {
    this.database.query();
    this.logger.log("added user");
  }
}

class RegistrationService {
  constructor(
    private logger: Logger,
    private usersManager: UsersManager,
  ) {}
  registerUser() {
    this.usersManager.addUser();
    this.logger.log("registered user");
  }
}

const app = new App();
app.start();
app.database.usersManager.registrationService.registerUser();
app.stop();
```

In this variant, we moved some dependency creation inside the constructors of the classes that need them. While it helps to reduce the boilerplate code at the initialization point, it still tightly couples the classes, making it difficult to change or replace dependencies later.

## Example 3: Separating Concerns with Independent Services

Next, we will further refactor our application by separating some functionality into independent services. This helps in managing responsibilities better.

### Refactored Application Code

```typescript
class App {
  constructor(
    private logger: Logger,
    private connection: DatabaseConnection,
  ) {}
  start() {
    this.connection.connect();
    this.logger.log("started");
  }
  stop() {
    this.connection.disconnect();
    this.logger.log("stopped");
  }
}

class Database {
  constructor(
    private logger: Logger,
    private connection: DatabaseConnection,
  ) {}
  query() {
    this.connection.rawQuery();
    this.logger.log("queried");
  }
}

class Logger {
  log(message: string) {
    console.log(message);
  }
}

class UsersManager {
  constructor(
    private logger: Logger,
    private database: Database,
  ) {}
  addUser() {
    this.database.query();
    this.logger.log("added user");
  }
}

class RegistrationService {
  constructor(
    private logger: Logger,
    private usersManager: UsersManager,
  ) {}
  registerUser() {
    this.usersManager.addUser();
    this.logger.log("registered user");
  }
}

class DatabaseConnection {
  constructor(private logger: Logger) {}
  rawQuery() {
    this.logger.log("raw queried");
  }
  connect() {
    this.logger.log("connected");
  }
  disconnect() {
    this.logger.log("disconnected");
  }
}
```

In this refactoring, we introduced a new `DatabaseConnection` class to handle the actual connection logic. This separation of concerns makes the code more modular and easier to manage.

### Initialization Variant 1

```typescript
const logger = new Logger();
const databaseConnection = new DatabaseConnection(logger);
const database = new Database(logger, databaseConnection);
const usersManager = new UsersManager(logger, database);
const registrationService = new RegistrationService(logger, usersManager);
const app = new App(logger, databaseConnection);
app.start();
registrationService.registerUser();
app.stop();
```

This variant shows the manual creation and wiring of all instances, including the new `DatabaseConnection` class. As expected, this can get complex and error-prone as the number of dependencies grows.

### Initialization Variant 2

```typescript
class App {
  private logger: Logger;
  private databaseConnection: DatabaseConnection;
  readonly database: Database;
  constructor() {
    this.logger = new Logger();
    this.databaseConnection = new DatabaseConnection(this.logger);
    this.database = new Database(this.logger, this.databaseConnection);
  }
  start() {
    this.databaseConnection.connect();
    this.logger.log("started");
  }
  stop() {
    this.databaseConnection.disconnect();
    this.logger.log("stopped");
  }
}

class Database {
  readonly usersManager: UsersManager;
  constructor(private logger: Logger, private connection: DatabaseConnection) {
    this.usersManager = new UsersManager(logger, this);
  }
  query() {
    this.connection.rawQuery();
    this.logger.log("queried");
  }
}

class Logger {
  log(message: string) {
    console.log(message);
  }
}

class UsersManager {
  readonly registrationService: RegistrationService;
  constructor(
    private logger: Logger,
    private database: Database,
  ) {
    this.registrationService = new RegistrationService(logger, this);
  }
  addUser() {
    this.database.query();
    this.logger.log("added user");
  }
}

class RegistrationService {
  constructor(
    private logger: Logger,
    private usersManager: UsersManager,
  ) {}
  registerUser() {
    this.usersManager.addUser();
    this.logger.log("registered user");
  }
}

class DatabaseConnection {
  constructor(private logger: Logger) {}
  rawQuery() {
    this.logger.log("raw queried");
  }
  connect() {
    this.logger.log("connected");
  }
  disconnect() {
    this.logger.log("disconnected");
  }
}

const app = new App();
app.start();
app.database.usersManager.registrationService.registerUser();
app.stop();
```

In this variant, the `App` class internally creates instances of `Logger`, `DatabaseConnection`, and `Database`. This approach reduces some boilerplate but still involves manual wiring inside the constructors.

However, note that the logical hierarchy `app.database.usersManager.registrationService` is problematic. This is a consequence of manual dependency management. As our code evolves, dependencies need to be moved up the hierarchy to be shared with other dependencies. This makes it difficult to maintain a clean separation of concerns and manage dependencies efficiently.

## Example 4: Introducing Dependency Injection

Now, let's integrate the `@wroud/di` dependency injection system into our application to manage our dependencies more effectively.

### Using `@wroud/di` for Dependency Management

First, we need to set up the `@wroud/di` dependency injection system.

```typescript
import { ServiceContainerBuilder, injectable } from "@wroud/di";

@injectable()
class Logger {
  log(message: string) {
    console.log(message);
  }
}

@injectable(() => [Logger])
class DatabaseConnection {
  constructor(private logger: Logger) {}
  rawQuery() {
    this.logger.log("raw queried");
  }
  connect() {
    this.logger.log("connected");
  }
  disconnect() {
    this.logger.log("disconnected");
  }
}

@injectable(() => [Logger, DatabaseConnection])
class App {
  constructor(
    private logger: Logger,
    private connection: DatabaseConnection,
  ) {}
  start() {
    this.connection.connect();
    this.logger.log("started");
  }
  stop() {
    this.connection.disconnect();
    this.logger.log("stopped");
  }
}

@injectable(() => [Logger, DatabaseConnection])
class Database {
  constructor(
    private logger: Logger,
    private connection: DatabaseConnection,
  ) {}
  query() {
    this.connection.rawQuery();
    this.logger.log("queried");
  }
}

@injectable(() => [Logger, Database])
class UsersManager {
  constructor(
    private logger: Logger,
    private database: Database,
  ) {}
  addUser() {
    this.database.query();
    this.logger.log("added user");
  }
}

@injectable(() => [Logger, UsersManager])
class RegistrationService {
  constructor(
    private logger: Logger,
    private usersManager: UsersManager,
  ) {}
  registerUser() {
    this.usersManager.addUser();
    this.logger.log("registered user");
  }
}

const serviceProvider = new ServiceContainerBuilder()
  .addSingleton(Logger)
  .addSingleton(DatabaseConnection)
  .addSingleton(App)
  .addSingleton(Database)
  .addSingleton(UsersManager)
  .addSingleton(RegistrationService)
  .build();

const app = serviceProvider.getService(App);
const registrationService = serviceProvider.getService(RegistrationService);
app.start();
registrationService.registerUser();
app.stop();
```

### Explanation

1. **Defining Services**: Each class is decorated with `@injectable()`, making them injectable services.
2. **Service Container Builder**: We create a `ServiceContainerBuilder` and register each service with `addSingleton`.
3. **Resolving Dependencies**: The `ServiceContainerBuilder` automatically handles the creation and injection of dependencies.
4. **Starting the Application**: The `App` class is resolved from the container, and its dependencies are injected automatically.

### Benefits of Using Dependency Injection

- **Simplicity**: Dependencies are declared and managed in one place, reducing boilerplate code.
- **Flexibility**: Easily swap implementations of services without changing the dependent code.
- **Testability**: Mock dependencies can be injected for testing purposes, improving testability.
- **Maintainability**: As the project grows, managing dependencies remains straightforward and less error-prone.

### Summary

Through these examples, we've illustrated the progression from manual dependency management to using a dependency injection system. By leveraging `@wroud/di`, we achieve a cleaner, more maintainable, and flexible codebase. Dependency Injection simplifies the initialization and wiring of services, allowing developers to focus on the core logic of their applications.
