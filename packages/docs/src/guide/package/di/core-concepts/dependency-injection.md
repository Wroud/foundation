---
outline: deep
---

# Dependency Injection

Dependency Injection (DI) is a design pattern used to implement IoC (Inversion of Control), allowing you to develop loosely coupled code. This guide will help you understand the principles of DI and how to use @wroud/di to manage dependencies in your projects.

## What is Dependency Injection?

Dependency Injection is a technique where an object receives its dependencies from an external source rather than creating them itself. This promotes decoupling and enhances testability and maintainability.

### Benefits of Dependency Injection

- **Decoupling**: Reduces dependencies between components, making your code more modular and easier to manage.
- **Testability**: Simplifies unit testing by allowing you to mock dependencies.
- **Flexibility**: Makes it easier to switch between different implementations of a service.

## Dependency Injection in @wroud/di

In @wroud/di, you use the `ServiceContainerBuilder` to register services and their dependencies. The `IServiceProvider` is then used to resolve these services.

### Registering and Resolving Services

Services are registered with different lifetimes using methods like `addSingleton`, `addTransient`, and `addScoped`.

#### Example: Registering and Resolving Services with Decorators

```javascript
import { ServiceContainerBuilder, injectable } from '@wroud/di';

@injectable()
class Logger {
    log(message: string) {
        console.log(message);
    }
}

@injectable(() => [Logger])
class UserService {
    constructor(private logger: Logger) {
        this.logger = logger;
    }

    createUser(user: { name: string }) {
        this.logger.log(`Creating user: ${user.name}`);
        // User creation logic
    }
}

const containerBuilder = new ServiceContainerBuilder();
containerBuilder.addSingleton(Logger);
containerBuilder.addTransient(UserService);
const serviceProvider = containerBuilder.build();

const userService = serviceProvider.getService(UserService);
userService.createUser({ name: 'John Doe' });
```

## Injecting Multiple Services

@wroud/di allows you to inject multiple services into a single class.

### Example: Injecting Multiple Services

```javascript
import { ServiceContainerBuilder, injectable } from '@wroud/di';

@injectable()
class Logger {
    log(message: string) {
        console.log(message);
    }
}

@injectable()
class ConfigService {
    getConfig() {
        return { appName: 'MyApp' };
    }
}

@injectable(() => [Logger, ConfigService])
class UserService {
    constructor(private logger: Logger, private configService: ConfigService) { }

    createUser(user: { name: string }) {
        this.logger.log(`Creating user: ${user.name} in ${this.configService.getConfig().appName}`);
        // User creation logic
    }
}

const containerBuilder = new ServiceContainerBuilder();
containerBuilder.addSingleton(Logger);
containerBuilder.addSingleton(ConfigService);
containerBuilder.addTransient(UserService);
const serviceProvider = containerBuilder.build();

const userService = serviceProvider.getService(UserService);
userService.createUser({ name: 'John Doe' });
```

## Resolving Multiple Implementations of a Service

You can register and resolve multiple implementations of a service type using tokens.

### Example: Resolving All Implementations of a Service Type

```javascript
import { ServiceContainerBuilder, injectable, createService } from '@wroud/di';

interface ILogger {
    log(message: string): void;
}

const ILogger = createService<ILogger>('ILogger');

@injectable()
class ConsoleLogger implements ILogger {
    log(message: string) {
        console.log(`ConsoleLogger: ${message}`);
    }
}

@injectable()
class FileLogger implements ILogger {
    log(message: string) {
        // Assume logging to a file
        console.log(`FileLogger: ${message}`);
    }
}

@injectable(() => [[ILogger]])
class LoggingService {
    constructor(private loggers: ILogger[]) {}

    logToAll(message: string) {
        this.loggers.forEach(logger => logger.log(message));
    }
}

const containerBuilder = new ServiceContainerBuilder();
containerBuilder.addSingleton(ILogger, ConsoleLogger);
containerBuilder.addSingleton(ILogger, FileLogger);
containerBuilder.addTransient(LoggingService);
const serviceProvider = containerBuilder.build();

const loggingService = serviceProvider.getService(LoggingService);
loggingService.logToAll('This is a test message');
```

## Conclusion

Dependency Injection is a powerful pattern for managing dependencies in your application, promoting decoupling and enhancing testability. By using @wroud/di, you can easily register and resolve services, allowing you to build modular and maintainable applications.
