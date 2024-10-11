---
outline: deep
---

# Service Disposal

Service disposal in @wroud/di is crucial for managing the lifecycle of services, especially those that hold resources like file handles or database connections. This guide will show you how to set up and use service disposal mechanisms to ensure proper resource management in your application.

## What is Service Disposal?

Service disposal involves properly releasing resources held by services when they are no longer needed. This is particularly important for services that manage external resources like files, network connections, or database connections.

## Setting Up Service Disposal

@wroud/di uses the TC39 proposal for explicit resource management to facilitate service disposal. You can choose between automatic disposal using the `using` keyword or manual disposal.

::: details
For more information about the `using` keyword and explicit resource management, refer to the [TC39 proposal for explicit resource management](https://github.com/tc39/proposal-explicit-resource-management).
:::

### Service Lifetimes and Disposal

- **Transient**: Transient services are created each time they are requested. It is the user's responsibility to dispose of them manually.
- **Scoped**: Scoped services are created once per request or scope. They are disposed of automatically at the end of the request or scope.
- **Singleton**: Singleton services are created the first time they are requested and live for the duration of the application's lifetime. They are disposed of automatically when the service provider is disposed.

### Automatic Disposal

With the `using` keyword, services are automatically disposed of when they go out of scope.

#### Example: Automatic Disposal

```typescript
import { ServiceContainerBuilder, injectable } from "@wroud/di";

@injectable()
class DatabaseConnection {
  connect() {
    console.log("Database connected");
  }

  [Symbol.dispose]() {
    console.log("Database connection closed");
  }
}

const builder = new ServiceContainerBuilder();
builder.addSingleton(DatabaseConnection);

using serviceProvider = builder.build();

const dbConnection = serviceProvider.getService(DatabaseConnection);
dbConnection.connect();
// When the serviceProvider goes out of scope, the DatabaseConnection will be disposed of automatically
```

### Asynchronous Disposal

For services that require asynchronous cleanup, use `Symbol.asyncDispose`. You can also name the function `dispose`; it will be used as a fallback if `Symbol.asyncDispose` is not presented.

#### Example: Asynchronous Disposal

```typescript
import { ServiceContainerBuilder, injectable } from "@wroud/di";

@injectable()
class AsyncService {
  async init() {
    console.log("AsyncService initialized");
  }

  async [Symbol.asyncDispose]() {
    console.log("AsyncService cleaned up asynchronously");
  }
}

const builder = new ServiceContainerBuilder();
builder.addSingleton(AsyncService);

await using serviceProvider = builder.build();

const asyncService = serviceProvider.getService(AsyncService);
await asyncService.init();

// When the serviceProvider goes out of scope, the AsyncService will be disposed of automatically
```

### Manual Disposal of Transient Services

Transient services must be disposed of manually by the user. Here's how you can do it:

#### Example: Manual Disposal of Transient Services

```typescript
import { ServiceContainerBuilder, injectable } from "@wroud/di";

@injectable()
class Logger {
  log(message: string) {
    console.log(message);
  }

  // you also can use dispose() function it will be used as a fallback if `Symbol.dispose` not presented
  [Symbol.dispose]() {
    console.log("Logger disposed");
  }
}

const builder = new ServiceContainerBuilder();
builder.addTransient(Logger);

const serviceProvider = builder.build();

using logger = serviceProvider.getService(Logger);
logger.log("This is a log message");

// When the logger goes out of scope, the Logger will be disposed of automatically
```

### Disposal of Scoped Services

Scoped services are disposed of at the end of a request or scope. Here's how you can manage scoped services:

#### Example: Automatic Disposal of Scoped Services

```typescript
import { ServiceContainerBuilder, injectable } from "@wroud/di";

@injectable()
class RequestHandler {
  handle() {
    console.log("Handling request");
  }

  // you also can use dispose() function it will be used as a fallback if `Symbol.dispose` not presented
  [Symbol.dispose]() {
    console.log("RequestHandler disposed");
  }
}

const builder = new ServiceContainerBuilder();
builder.addScoped(RequestHandler);
using serviceProvider = builder.build();

function handleRequest() {
  using scope = serviceProvider.createScope();

  const requestHandler = scope.serviceProvider.getService(RequestHandler);
  requestHandler.handle();
  // When the scope goes out of scope, the RequestHandler will be disposed of automatically
}

handleRequest();
```

## Manual Disposal

Manual disposal requires the developer to explicitly call the disposal methods (`[Symbol.dispose]()` or `[Symbol.asyncDispose]()`) without using the `using` keyword.

### Manual Disposal

Manual disposal requires you to explicitly call the `[Symbol.dispose]()` method.

#### Example: Manual Disposal

```typescript
import { ServiceContainerBuilder, injectable } from "@wroud/di";

@injectable()
class Cache {
  clear() {
    console.log("Cache cleared");
  }

  [Symbol.dispose]() {
    console.log("Cache disposed");
  }
}

const builder = new ServiceContainerBuilder();
builder.addSingleton(Cache);

const serviceProvider = builder.build();
const cache = serviceProvider.getService(Cache);
cache.clear();

// Manually dispose of the service provider
serviceProvider[Symbol.dispose]();
```

### Manual Asynchronous Disposal

Manual asynchronous disposal requires you to explicitly call the `[Symbol.asyncDispose]()` method.

#### Example: Manual Asynchronous Disposal

```typescript
import { ServiceContainerBuilder, injectable } from "@wroud/di";

@injectable()
class AsyncProcessor {
  async process() {
    console.log("Processing asynchronously");
  }

  async [Symbol.asyncDispose]() {
    console.log("AsyncProcessor cleaned up asynchronously");
  }
}

const builder = new ServiceContainerBuilder();
builder.addSingleton(AsyncProcessor);

const serviceProvider = builder.build();
const asyncProcessor = serviceProvider.getService(AsyncProcessor);
await asyncProcessor.process();

// Manually dispose of the service provider
await serviceProvider[Symbol.asyncDispose]();
```

## Real-World Example: Managing Database Connections

Consider an application that manages database connections. Proper disposal of these connections is critical to avoid resource leaks. In this example, we will use a combination of singleton and transient services.

```typescript
import { ServiceContainerBuilder, injectable } from "@wroud/di";

@injectable()
class DatabaseConnection {
  connect() {
    console.log("Database connected");
  }

  [Symbol.dispose]() {
    console.log("Database connection closed");
  }
}

@injectable()
class Logger {
  log(message: string) {
    console.log(message);
  }

  [Symbol.dispose]() {
    console.log("Logger disposed");
  }
}

const builder = new ServiceContainerBuilder();
builder.addSingleton(DatabaseConnection);
builder.addTransient(Logger);

// Using automatic disposal for singleton service
using serviceProvider = builder.build();

const dbConnection = serviceProvider.getService(DatabaseConnection);
dbConnection.connect();
// Database connection will be automatically closed when the serviceProvider goes out of scope

// Using manual disposal for transient services
using logger = serviceProvider.getService(Logger);
logger.log("This is a log message");

// When the logger goes out of scope, the Logger will be disposed of automatically
```

## Benefits of Service Disposal

- **Resource Management**: Ensures that resources such as file handles and database connections are properly released.
- **Avoids Memory Leaks**: Proper disposal helps prevent memory leaks by ensuring that resources are not held longer than necessary.
- **Enhanced Stability**: Proper resource management enhances the stability and reliability of your application.

## Conclusion

Service disposal is a critical aspect of resource management in any application. By using the service disposal mechanisms in @wroud/di, you can ensure that resources are properly managed and released, enhancing the stability and performance of your application.
