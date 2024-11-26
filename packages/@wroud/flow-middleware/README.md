# @wroud/flow-middleware

[![ESM-only package][package]][esm-info-url]
[![NPM version][npm]][npm-url]

<!-- [![Install size][size]][size-url] -->

[package]: https://img.shields.io/badge/package-ESM--only-ffe536.svg
[esm-info-url]: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c
[npm]: https://img.shields.io/npm/v/@wroud/flow-middleware.svg
[npm-url]: https://npmjs.com/package/@wroud/flow-middleware
[size]: https://packagephobia.com/badge?p=@wroud/flow-middleware
[size-url]: https://packagephobia.com/result?p=@wroud/flow-middleware

@wroud/flow-middleware is a lightweight middleware management library for JavaScript and TypeScript. It facilitates the creation and execution of middleware chains with support for re-runs, error handling, and disposability. Inspired by modern middleware patterns, it leverages TypeScript for type safety and ESM for optimal performance.

## Features

- **Modern JavaScript**: Utilizes ES modules and ESNext syntax for advanced performance optimizations.
- **TypeScript**: Written in TypeScript for type safety and enhanced developer experience.
- **Middleware Chains**: Easily create and manage middleware chains with support for asynchronous operations.
- **Re-run Capabilities**: Middlewares can trigger re-execution of the middleware chain based on external events.
- **Error Handling**: Dedicated error-handling middlewares to manage and respond to errors gracefully.
- **Subscription Management**: Efficiently handle subscriptions with automatic cleanup to prevent memory leaks.
- **Disposability**: Cleanly dispose of middleware requests and all associated subscriptions.

## Installation

Install via npm:

```sh
npm install @wroud/flow-middleware
```

Install via yarn:

```sh
yarn add @wroud/flow-middleware
```

## Documentation

For detailed usage and API reference, visit the [documentation site](https://wroud.dev).

## Example

```ts
import { FlowMiddleware } from "@wroud/flow-middleware";
import type {
  IMiddleware,
  IErrorMiddleware,
} from "@wroud/flow-middleware/interfaces";

/**
 * Simple Middleware Example
 */
const simpleMiddleware: IMiddleware<{ message: string }> = async (
  req,
  next,
  triggerReRun,
  subscribe,
) => {
  console.log("Middleware: Processing message:", req.message);
  await next();
};

/**
 * Simple Error Middleware Example
 */
const simpleErrorMiddleware: IErrorMiddleware<{ message: string }> = async (
  error,
  req,
  next,
  triggerReRun,
  subscribe,
) => {
  console.error("ErrorMiddleware: An error occurred:", error.message);
  // Handle error, modify request data, or trigger re-run
  req.message = "Error handled";
  triggerReRun();
};

const middleware = new FlowMiddleware();

// Register middlewares
middleware.register(simpleMiddleware);
middleware.registerErrorMiddleware(simpleErrorMiddleware);

// Create a new request with initial data
const request = middleware.createRequest({ message: "Hello, FlowMiddleware!" });

// Execute the middleware chain
(async () => {
  try {
    await request.execute();
  } catch (error) {
    console.error("Main: Error executing middleware chain:", error);
  }
})();
```

## Changelog

All notable changes to this project will be documented in the [CHANGELOG](./CHANGELOG.md) file.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
