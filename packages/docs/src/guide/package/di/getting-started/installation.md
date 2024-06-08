---
outline: deep
---

# Installation

In this guide, we will walk you through the steps to install and set up @wroud/di in your JavaScript project. Follow these steps to get started with dependency injection in your application.

## Prerequisites

Before you begin, ensure you have the following:

- **Node.js**: Make sure you have Node.js installed. You can download it from [nodejs.org](https://nodejs.org).
- **npm or yarn**: A package manager to install dependencies. npm comes with Node.js, but you can also use yarn if you prefer.

## Step 1: Install @wroud/di

You can install @wroud/di using npm or yarn. For complete installation instructions, please visit the [installation page](/packages/di/install). Run one of the following commands in your project directory:

::: code-group

```sh [npm]
npm install @wroud/di
```

```sh [yarn]
yarn add @wroud/di
```

```sh [pnpm]
pnpm add @wroud/di
```

```sh [bun]
bun add @wroud/di
```

:::

## Step 2: Set Up Your Project

### JavaScript

If you are using plain JavaScript, you can start using @wroud/di directly after installation. Here’s a basic setup example:

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

### TypeScript

If you are using TypeScript, here's an example setup:

```typescript
import { ServiceContainerBuilder, injectable } from '@wroud/di';

@injectable()
class Logger {
    log(message: string) {
        console.log(message);
    }
}

@injectable(() => [Logger])
class UserService {
    constructor(private logger: Logger) {}

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

## Conclusion

You have successfully installed and set up @wroud/di in your project. You are now ready to start using dependency injection to manage your services and dependencies. Explore the rest of the guides to learn more about the core concepts and advanced features of @wroud/di.
