---
outline: deep
---

# Service Container

The service container is at the heart of the @wroud/di library, enabling you to manage and resolve dependencies in your application. This guide will help you understand how to register and resolve services using the `ServiceContainerBuilder` and `IServiceProvider`.

## What is a Service Container?

A service container, also known as a dependency injection container, is a design pattern used to manage the creation, configuration, and resolution of dependencies in a software application. It helps in achieving loose coupling, improving testability, and enhancing maintainability.

## How to Register Services

Service registration involves adding your services to the service container so they can be resolved when needed. @wroud/di provides several methods for registering services, depending on their intended lifetimes: singleton, transient, and scoped.

### Singleton Services

Singleton services are created once and shared throughout the application. To register a singleton service, use the `addSingleton` method.

```javascript
import { ServiceContainerBuilder, injectable } from '@wroud/di';

@injectable()
class Logger {
    log(message: string) {
        console.log(message);
    }
}

const containerBuilder = new ServiceContainerBuilder();
containerBuilder.addSingleton(Logger);
const serviceProvider = containerBuilder.build();

const logger1 = serviceProvider.getService(Logger);
const logger2 = serviceProvider.getService(Logger);

console.log(logger1 === logger2); // true
```

### Transient Services

Transient services are created each time they are requested. To register a transient service, use the `addTransient` method.

```javascript
import { ServiceContainerBuilder, injectable } from '@wroud/di';

@injectable()
class Logger {
    log(message: string) {
        console.log(message);
    }
}

const containerBuilder = new ServiceContainerBuilder();
containerBuilder.addTransient(Logger);
const serviceProvider = containerBuilder.build();

const logger1 = serviceProvider.getService(Logger);
const logger2 = serviceProvider.getService(Logger);

console.log(logger1 === logger2); // false
```

### Scoped Services

Scoped services are created once per scope. This is useful in scenarios like web requests where you want to share services within a specific context. To register a scoped service, use the `addScoped` method.

```javascript
import { ServiceContainerBuilder, injectable } from '@wroud/di';

@injectable()
class Logger {
    log(message: string) {
        console.log(message);
    }
}

const containerBuilder = new ServiceContainerBuilder();
containerBuilder.addScoped(Logger);
const serviceProvider = containerBuilder.build();

const scope1 = serviceProvider.createScope();
const scope2 = serviceProvider.createScope();

const logger1 = scope1.serviceProvider.getService(Logger);
const logger2 = scope2.serviceProvider.getService(Logger);

console.log(logger1 === logger2); // false

const logger3 = scope1.serviceProvider.getService(Logger);
console.log(logger1 === logger3); // true
```

## How to Resolve Dependencies

Dependency resolution is the process of retrieving an instance of a registered service. @wroud/di automatically handles the resolution of dependencies based on the service registration and their lifetimes.

### Constructor Injection

Constructor injection is the primary way to inject dependencies in @wroud/di. Dependencies are declared in the constructor and resolved automatically by the container.

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

## Benefits of Using a Service Container

- **Loose Coupling**: Services are decoupled from their dependencies, allowing for easier modifications and replacements.
- **Improved Testability**: Dependencies can be easily mocked or stubbed during testing.
- **Enhanced Maintainability**: Clear dependency management leads to more maintainable codebases.

## Conclusion

The service container in @wroud/di is a powerful tool that enables effective dependency management. By understanding how to register and resolve services, you can leverage dependency injection to create flexible and maintainable applications.
