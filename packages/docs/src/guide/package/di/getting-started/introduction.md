---
outline: deep
---

# Introduction to @wroud/di

Welcome to the introduction guide for @wroud/di, a lightweight and flexible dependency injection library for JavaScript. Inspired by the .NET framework, @wroud/di aims to bring the power of dependency injection to JavaScript projects, making it easier to manage dependencies and build modular, testable applications.

## What is Dependency Injection?

Dependency Injection (DI) is a design pattern that helps to decouple the creation of objects from their usage. It allows you to inject dependencies into a class or function, promoting loose coupling and enhancing testability.

## Key Features

@wroud/di offers a range of features to help you implement dependency injection effectively:

- **Service Registration and Resolution**: Easily register services and resolve them using the `ServiceContainerBuilder` and `IServiceProvider`.
- **Service Lifetimes**: Support for various service lifetimes, including singleton, transient, and scoped.
- **Decorators**: Use decorators to register services and their dependencies.
- **Factory Services**: Create and inject factory services for dynamic service creation.
- **Service Disposal**: Manage and dispose of services properly to avoid memory leaks.

## Benefits of Using @wroud/di

- **Modular Architecture**: Promote a modular architecture by decoupling components.
- **Testability**: Enhance testability by injecting mock dependencies.
- **Maintainability**: Improve maintainability by managing dependencies centrally.
- **Flexibility**: Easily configure and manage different service lifetimes and dependencies.

## Getting Started

To get started with @wroud/di, follow the [installation guide](installation) to set up the library in your project. Once installed, you can explore the core concepts and advanced features to harness the full potential of dependency injection in your application.

## Example Usage

Here is a simple example to demonstrate how @wroud/di can be used in a project:

```javascript
import { ServiceContainerBuilder, injectable } from '@wroud/di';

// Define a service
@injectable()
class Logger {
    log(message: string) {
        console.log(message);
    }
}

// Define another service that depends on Logger
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

// Build the service container
const containerBuilder = new ServiceContainerBuilder();
containerBuilder.addSingleton(Logger);
containerBuilder.addTransient(UserService);
const serviceProvider = containerBuilder.build();

// Resolve and use the UserService
const userService = serviceProvider.getService(UserService);
userService.createUser({ name: 'John Doe' });
```

In this example, the `UserService` depends on the `Logger` service. @wroud/di manages the dependency injection, ensuring that `UserService` receives an instance of `Logger`.

## Conclusion

@wroud/di is designed to bring the benefits of dependency injection to JavaScript projects, making it easier to manage dependencies and build scalable, maintainable applications. Explore the rest of the guides to learn more about the core concepts, advanced features, and practical examples.
