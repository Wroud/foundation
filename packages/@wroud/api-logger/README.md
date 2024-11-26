# @wroud/api-logger

[![ESM-only package][package]][esm-info-url]
[![NPM version][npm]][npm-url]

<!-- [![Install size][size]][size-url] -->

[package]: https://img.shields.io/badge/package-ESM--only-ffe536.svg
[esm-info-url]: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c
[npm]: https://img.shields.io/npm/v/@wroud/api-logger.svg
[npm-url]: https://npmjs.com/package/@wroud/api-logger
[size]: https://packagephobia.com/badge?p=@wroud/api-logger
[size-url]: https://packagephobia.com/result?p=@wroud/api-logger

@wroud/api-logger is a lightweight and flexible logging interface library for JavaScript and TypeScript applications. It provides a standardized way to implement logging across your projects, ensuring consistency and ease of maintenance. Designed with modern JavaScript features in mind, it seamlessly integrates with various logging implementations.

## Features

- **TypeScript Support**: Fully typed interfaces for enhanced developer experience.
- **ESM-only Package**: Utilizes ES modules for optimal performance and compatibility.
- **Flexible Logging Levels**: Supports `info`, `warn`, and `error` levels.
- **Ease of Integration**: Easily implement the `ILogger` interface with your preferred logging libraries.

## Installation

Install via npm:

```sh
npm install @wroud/api-logger
```

Install via yarn:

```sh
yarn add @wroud/api-logger
```

## Documentation

For detailed usage and API reference, visit the [documentation site](https://wroud.dev/).

## Example

```ts
// Import the ILogger interface
import { ILogger } from "@wroud/api-logger";

// Implement the ILogger interface
class ConsoleLogger implements ILogger {
  info(...messages: any[]): void {
    console.info(...messages);
  }

  warn(...messages: any[]): void {
    console.warn(...messages);
  }

  error(...messages: any[]): void {
    console.error(...messages);
  }
}

// Usage example
const logger: ILogger = new ConsoleLogger();

logger.info("This is an info message");
logger.warn("This is a warning message");
logger.error("This is an error message");
```

### Integrating with @wroud/di

If you're using `@wroud/di` for dependency injection, you can easily inject your logger implementation:

```ts
import { ServiceContainerBuilder, injectable } from "@wroud/di";
import { ILogger } from "@wroud/api-logger";

@injectable()
class ConsoleLogger implements ILogger {
  info(...messages: any[]): void {
    console.info(...messages);
  }

  warn(...messages: any[]): void {
    console.warn(...messages);
  }

  error(...messages: any[]): void {
    console.error(...messages);
  }
}

const builder = new ServiceContainerBuilder();
builder.addSingleton(ConsoleLogger);
const provider = builder.build();

const logger = provider.getService(ConsoleLogger);
logger.info("Hello world with DI!");
```

## Changelog

All notable changes to this project will be documented in the [CHANGELOG](./CHANGELOG.md) file.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
