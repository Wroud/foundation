# @wroud/di-react

`@wroud/di-react` is a set of bindings (components and hooks) for integrating the `@wroud/di` dependency injection library with React. It simplifies dependency management in React applications by providing easy-to-use tools for accessing services and managing their lifecycles within React components.

## Features

- **Seamless Integration**: Easily connect your `@wroud/di` service container to React components.
- **React Hooks**: Access services directly in your functional components with hooks like `useService` and `useServices`.
- **Service Context Provider**: Use the `ServiceProvider` component to provide services to your component tree.
- **Support for Async Services**: Fully compatible with async service resolution using `@wroud/di` features.
- **TypeScript Support**: Built with TypeScript for strong typing and better developer experience.

## Installation

You can install `@wroud/di-react` using npm, yarn, pnpm, or bun:

Install via npm:

```sh
npm install @wroud/di-react
```

Install via yarn:

```sh
yarn add @wroud/di-react
```

## Usage

Here's a quick example of how to use `@wroud/di-react` in your project:

```typescript
import React from 'react';
import { ServiceContainerBuilder } from '@wroud/di';
import { ServiceProvider, useService } from '@wroud/di-react';

// Step 1: Create and configure your service container
const builder = new ServiceContainerBuilder();
builder.addSingleton(SomeService);
const serviceProvider = builder.build();

// Step 2: Use ServiceProvider to make the services available in your component tree
function App() {
  return (
    <ServiceProvider provider={serviceProvider}>
      <MyComponent />
    </ServiceProvider>
  );
}

// Step 3: Use hooks to access services in your components
function MyComponent() {
  const someService = useService(SomeService);

  return <div>{someService.doSomething()}</div>;
}
```

## Documentation

For detailed usage and API reference, visit the [documentation site](https://wroud.dev).

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
