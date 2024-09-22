---
outline: deep
---

# Installation

<Badges name="@wroud/di-react" />

Install with npm:

::: code-group

```sh [npm]
npm install @wroud/di-react
```

```sh [yarn]
yarn add @wroud/di-react
```

```sh [pnpm]
pnpm add @wroud/di-react
```

```sh [bun]
bun add @wroud/di-react
```

:::

## Usage

### Shorthands

The `@wroud/di-react` package provides useful shorthand methods. For example, `useService` simplifies injecting a service instance directly into a React component. Here’s a quick example:

```tsx twoslash
import React from "react";
import { ServiceContainerBuilder } from "@wroud/di";
import { ServiceProvider, useService } from "@wroud/di-react";

const builder = new ServiceContainerBuilder();

class Logger {
  log(message: string) {
    console.log(message);
  }
}

builder.addSingleton(Logger);

const serviceProvider = builder.build();

function App() {
  return (
    <ServiceProvider provider={serviceProvider}>
      <Log />
    </ServiceProvider>
  );
}

function Log() {
  const logger = useService(Logger);
  logger.log("Hello world!");
  // -> Hello world!

  return <>Check the console output.</>;
}
```
