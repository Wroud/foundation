---
outline: deep
---

# Service Lifetimes

Understanding service lifetimes is crucial when working with dependency injection. This guide will explain the different service lifetimes available in @wroud/di and how to use them effectively.

## What Are Service Lifetimes?

Service lifetimes define how long a service instance should be kept alive. There are three main types of lifetimes in @wroud/di:

- **Singleton**: A single instance is shared across the entire application.
- **Transient**: A new instance is created every time the service is requested.
- **Scoped**: A single instance is created and shared within a defined scope.

## Singleton Lifetime

A singleton service is created once and shared throughout the application. This is useful for services that maintain state or need to be shared globally.

::: tip
Use singletons for services that are expensive to create or need to maintain state, such as logging services or configuration settings.
:::

### Example: Logger Service

A logging service is a good example of a singleton because you generally want all parts of your application to use the same logger instance.

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

## Transient Lifetime

A transient service is created every time it is requested. This is useful for lightweight, stateless services.

::: info
Transient services are ideal for services that do not hold state and are inexpensive to create.
:::

### Example: Email Service

An email service that sends notifications can be a transient service because it doesn't need to maintain any state between uses.

```javascript
import { ServiceContainerBuilder, injectable } from '@wroud/di';

@injectable()
class EmailService {
    sendEmail(recipient, subject, body) {
        console.log(`Sending email to ${recipient}: ${subject} - ${body}`);
    }
}

const containerBuilder = new ServiceContainerBuilder();
containerBuilder.addTransient(EmailService);
const serviceProvider = containerBuilder.build();

const emailService1 = serviceProvider.getService(EmailService);
const emailService2 = serviceProvider.getService(EmailService);

console.log(emailService1 === emailService2); // false
```

## Scoped Lifetime

A scoped service is created once per scope and shared within that scope. This is useful in scenarios like web applications where you might want to share services within a single request.

::: details
Scoped services are useful when you want to share a service instance within a specific context, such as a single web request.
:::

### Example: Database Context

A database context can be a scoped service, ensuring that all database operations within a single request use the same context instance.

```javascript
import { ServiceContainerBuilder, injectable } from '@wroud/di';

@injectable()
class DbContext {
    constructor() {
        this.connection = createDatabaseConnection();
    }
}

const containerBuilder = new ServiceContainerBuilder();
containerBuilder.addScoped(DbContext);
const serviceProvider = containerBuilder.build();

const scope1 = serviceProvider.createScope();
const scope2 = serviceProvider.createScope();

const dbContext1 = scope1.serviceProvider.getService(DbContext);
const dbContext2 = scope2.serviceProvider.getService(DbContext);

console.log(dbContext1 === dbContext2); // false

const dbContext3 = scope1.serviceProvider.getService(DbContext);
console.log(dbContext1 === dbContext3); // true
```

## Choosing the Right Lifetime

### When to Use Singleton

- When the service is expensive to create.
- When the service needs to maintain state.
- When you need a single instance across the entire application.

### When to Use Transient

- When the service is lightweight and stateless.
- When you want to ensure a fresh instance every time.

### When to Use Scoped

- When you need to share a service within a specific context.
- When you want to control the lifetime of a service within a defined scope.

## Conclusion

Understanding and using service lifetimes correctly is essential for efficient and maintainable dependency management. Choose the appropriate lifetime for your services based on their use case to optimize performance and resource usage.
