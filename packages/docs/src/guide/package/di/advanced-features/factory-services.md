---
outline: deep
---

# Factory Services

Factory services in @wroud/di provide a flexible way to create and configure services dynamically at runtime. This guide will show you how to set up and use factory services to meet your specific application needs.

## What are Factory Services?

Factory services are functions or methods that return a new instance of a service. This is particularly useful when the creation of a service depends on runtime information or when a service needs to be configured dynamically.

## Setting Up Factory Services

To set up a factory service, you define a factory function that creates the service instance. Then, you can register this factory function with the service container.

### Example: Creating a Simple Factory Service

In this example, we create a factory service for a `Logger` service.

```typescript
import { ServiceContainerBuilder, createService, IServiceProvider } from '@wroud/di';

interface ILogger {
    log(message: string): void;
}

const ILogger = createService<ILogger>('ILogger');

const builder = new ServiceContainerBuilder();
builder.addSingleton(ILogger, (serviceProvider: IServiceProvider): ILogger => {
    return {
        log(message: string) {
            console.log(message);
        },
    };
});

const serviceProvider = builder.build();

const logger = serviceProvider.getService(ILogger);
logger.log('This is a log message');
```

### Example: Using Factory Services with Dependencies

Factory services can also have dependencies that need to be resolved. In this example, we create a factory service for a `UserService` that depends on a `Logger` service.

```typescript
import { ServiceContainerBuilder, createService, IServiceProvider, injectable } from '@wroud/di';

interface ILogger {
    log(message: string): void;
}

const ILogger = createService<ILogger>('ILogger');

@injectable(() => [ILogger])
class UserService {
    constructor(private logger: ILogger) {}

    createUser(name: string) {
        this.logger.log(`Creating user: ${name}`);
        return { name };
    }
}

const builder = new ServiceContainerBuilder();

builder.addSingleton(ILogger, (serviceProvider: IServiceProvider): ILogger => {
    return {
        log(message: string) {
            console.log(message);
        },
    };
});

builder.addTransient(UserService, (serviceProvider: IServiceProvider): UserService => {
    const logger = serviceProvider.getService(ILogger);
    return new UserService(logger);
});

const serviceProvider = builder.build();

const userService = serviceProvider.getService(UserService);
const user = userService.createUser('John Doe');
console.log(user);
```

## Benefits of Factory Services

- **Dynamic Service Creation**: Allows for the creation of services with runtime information.
- **Flexible Configuration**: Services can be configured dynamically based on the current context.
- **Enhanced Dependency Management**: Factory services can leverage the full power of the dependency injection system, including resolving dependencies.

## Conclusion

Factory services in @wroud/di offer a powerful mechanism for creating and configuring services dynamically. By defining factory functions and registering them with the service container, you can handle complex service creation scenarios with ease. Use factory services to enhance the flexibility and configurability of your application.
