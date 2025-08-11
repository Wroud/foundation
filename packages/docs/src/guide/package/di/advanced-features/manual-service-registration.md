---
outline: deep
---

# Manual Service Registration

In this guide, we will explore how to manually register services and their dependencies using @wroud/di, without relying on decorators. This approach is useful if you prefer explicit service registration, if your project does not support decorators, or if you need to integrate external libraries with dependency injection.

## What is Manual Service Registration?

Manual service registration involves explicitly defining the dependencies of your services and registering them with the service container. This approach provides greater control over how services are configured and resolved.

## Registering Services

To manually register services, you can use the `ServiceContainerBuilder` and `ServiceRegistry` classes.

### Example: Registering Services Manually

```javascript
import { ServiceContainerBuilder, createService, constructor, factory } from '@wroud/di';

class Logger {
    log(message: string) {
        console.log(message);
    }
}

class UserService {
    constructor(private logger: Logger) {
        this.logger = logger;
    }

    createUser(user: { name: string }) {
        this.logger.log(`Creating user: ${user.name}`);
        // User creation logic
    }
}

function loggerInterop(logger: Logger) {
  return {
    log: (message: string) => logger.log(message);
  }
}

const loggerInterface = createService<typeof loggerInterop>('LoggerInterface');

const containerBuilder = new ServiceContainerBuilder();

// Register services in the container builder
containerBuilder
  .addSingleton(Logger, constructor(Logger))
  .addSingleton(loggerInterface, factory(loggerInterop, Logger))
  .addTransient(UserService, constructor(UserService, Logger));

const serviceProvider = containerBuilder.build();

const userService = serviceProvider.getService(UserService);
userService.createUser({ name: 'John Doe' });
```

### Example: Using Interfaces with Manual Registration

When using interfaces, you can create service tokens to register and resolve services.

```typescript
import {
  ServiceContainerBuilder,
  ServiceRegistry,
  createService,
  all,
} from "@wroud/di";

interface ILogger {
  log(message: string): void;
}

const ILogger = createService<ILogger>("ILogger");

class ConsoleLogger implements ILogger {
  log(message: string) {
    console.log(`ConsoleLogger: ${message}`);
  }
}

class FileLogger implements ILogger {
  log(message: string) {
    // Assume logging to a file
    console.log(`FileLogger: ${message}`);
  }
}

class LoggingService {
  constructor(private loggers: ILogger[]) {
    this.loggers = loggers;
  }

  logToAll(message: string) {
    this.loggers.forEach((logger) => logger.log(message));
  }
}

// Register services in the service registry
ServiceRegistry.register(ConsoleLogger, {
  name: "ConsoleLogger",
  dependencies: [],
});
ServiceRegistry.register(FileLogger, { name: "FileLogger", dependencies: [] });
ServiceRegistry.register(LoggingService, {
  name: "LoggingService",
  dependencies: [all(ILogger)],
});

const containerBuilder = new ServiceContainerBuilder();

// Register services in the container builder
containerBuilder.addSingleton(ILogger, ConsoleLogger);
containerBuilder.addSingleton(ILogger, FileLogger);
containerBuilder.addTransient(LoggingService);

const serviceProvider = containerBuilder.build();

const loggingService = serviceProvider.getService(LoggingService);
loggingService.logToAll("This is a test message");
```

## Integrating External Libraries

Manual service registration is particularly useful when you need to integrate external libraries into your dependency injection system. This allows you to manage the lifecycle and dependencies of external services seamlessly.

### Example: Integrating an External Library (TypeScript)

Suppose you are using an external library for HTTP requests. You can register a class from this library as a service and define its dependencies.

```typescript
import {
  ServiceContainerBuilder,
  constructor,
  createService,
  factory,
} from "@wroud/di";

// Define a service token for the API key
const ApiKey = createService<string>("ApiKey");

// Define a service token for the API key
type ExternalHttpClientAuth = typeof getAuthentication;
const ExternalHttpClientAuth = createService<typeof getAuthentication>("HttpClientAuth");

// External library class
class ExternalHttpClient {
  constructor(private apiKey: string) {}

  request(url: string) {
    // Make HTTP request using apiKey
  }
}

// External library function
function getAuthentication(private httpClient: ExternalHttpClient) {
  // internal implementation
}

// Application service that depends on the external library
class ApiService {
  constructor(private httpClient: ExternalHttpClient, private auth: ExternalHttpClientAuth) {}

  async auth(login: string, password: string) {
    await this.auth.login(login, password);
  }

  fetchData(endpoint: string) {
    return this.httpClient.request(endpoint);
  }
}

const containerBuilder = new ServiceContainerBuilder();

// Register services in the container builder
containerBuilder
  .addSingleton(ApiKey, "your-api-key")
  .addSingleton(ExternalHttpClient, constructor(ExternalHttpClient, ApiKey))
  .addSingleton(ExternalHttpClientAuth, factory(setAuthentication, ExternalHttpClient))
  .addTransient(ApiService, constructor(ApiService, ExternalHttpClient));

const serviceProvider = containerBuilder.build();

const apiService = serviceProvider.getService(ApiService);
await apiService.auth(env['login'], env['password'])
apiService.fetchData("https://api.example.com/data");
```

In this TypeScript example, the `ExternalHttpClient` class from an external library is registered with the service registry and the service container. The `ApiService` class can then depend on the `ExternalHttpClient`, allowing for seamless integration of the external library within the dependency injection system.

## Benefits of Manual Service Registration

- **Explicit Dependency Configuration**: Manually define and register services and their dependencies, offering clear visibility and control over the service setup.
- **Integration with External Libraries**: Easily integrate external libraries by manually registering their classes and defining dependencies explicitly.
- **No Decorator Dependency**: Ideal for projects that do not support decorators or prefer a different approach to dependency registration.
- **Compatibility with Interfaces**: Use service tokens to register and resolve services, making it easy to manage dependencies for interfaces.

## Conclusion

Manual service registration in @wroud/di provides a flexible and explicit way to manage dependencies in your application. By using `ServiceContainerBuilder` and `ServiceRegistry`, you can easily register and resolve services, enabling you to build modular and maintainable applications.
