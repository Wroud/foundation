# @wroud/di

@wroud/di is a lightweight dependency injection library for JavaScript, inspired by [.NET's DI](https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection) system. Written in TypeScript, it supports modern JavaScript features, including decorators, and provides robust dependency management capabilities.

## Features

- **Modern JavaScript**: Leverages ES modules and decorators.
- **TypeScript**: Written in TypeScript for type safety.
- **Flexible DI**: Supports singleton, transient, and scoped services.

## Installation

Install via npm:

```sh
npm install @wroud/di
```

Install via yarn

```sh
yarn add @wroud/di
```

## Documentation

For detailed usage and API reference, visit the [documentation site](https://wroud.dev).

## Example

```ts
import { ServiceContainerBuilder, injectable } from '@wroud/di';

@injectable()
class Logger {
  log(message: string) {
    console.log(message);
  }
}

const builder = new ServiceContainerBuilder();
builder.addSingleton(Logger);
const provider = builder.build();

const logger = provider.getService(Logger);
logger.log('Hello world!');
```

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
