---
outline: deep
---

# Usage

This guide will show you how to use the `@wroud/di` library in different setups: with [decorators (stage 3)](https://github.com/tc39/proposal-decorators), legacy decorators (stage 2), and plain JavaScript. Each section provides configuration tips and example code to help you get started quickly.

```ts twoslash
import { injectable, createService, ServiceContainerBuilder } from "@wroud/di";

interface ILoggerService {
  log(message: string): void;
}

const ILoggerService = createService<ILoggerService>("ILoggerService");

@injectable()
class ConsoleLoggerService implements ILoggerService {
  log(message: string) {
    console.log(message);
  }
}

@injectable(() => [ILoggerService])
class CounterService {
  constructor(private logger: ILoggerService) {}

  action() {
    this.logger.log("Action executed");
  }
}

const serviceProvider = new ServiceContainerBuilder()
  .addSingleton(CounterService)
  .addSingleton(ILoggerService, ConsoleLoggerService)
  .build();

const counter = serviceProvider.getService(CounterService);
```

[Try it in the Playground](https://stackblitz.com/edit/wroud-di-decorators?file=src%2Fcounter.ts)

## Decorators (stage 3)

[TypeScript Documentation](https://devblogs.microsoft.com/typescript/announcing-typescript-5-0/#decorators)

To use the latest decorator features in `@wroud/di`, you can utilize the stage 3 decorators. The `@injectable` decorator allows you to specify class constructor dependencies so they can be automatically injected by the DI system.

### Configuration

To use stage 3 decorators, ensure you have TypeScript version 5.0.0 or higher. Update your `tsconfig.json` file as follows:

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "lib": ["ESNext"], // or "Decorators"
    "experimentalDecorators": false,
    "emitDecoratorMetadata": false
  }
}
```

::: details Vite config
[Browsers is not supporting decorators](https://caniuse.com/decorators) yet so you need to downgrade target to es2023 or lower to run it in dev.

```diff
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
+  esbuild:{
+    target: "es2023"
+  },
  plugins: [react()],
});

```

:::

::: details Migration from Legacy Decorators (stage 2)

If you are migrating from legacy decorators (stage 2), you need to update your `tsconfig.json`:

```diff
{
  "compilerOptions": {
-    "experimentalDecorators": true,
-    "emitDecoratorMetadata": true,
+    "lib": ["ESNext"], // or "Decorators"
  }
}
```

:::
::: details You might need to install `tslib` if your target environment does not support decorators.

::: code-group

```sh [npm]
npm install tslib
```

```sh [yarn]
yarn add tslib
```

```sh [pnpm]
pnpm add tslib
```

```sh [bun]
bun add tslib
```

:::

## Legacy Decorators (stage 2)

If you prefer or need to use legacy decorators, you can still use `@wroud/di` with them. The code structure remains the same.

[Try it in the Playground](https://stackblitz.com/edit/wroud-di-legacy-decorators?file=src%2Fcounter.ts)

### Configuration

Enable legacy decorators in your `tsconfig.json`:

```json [tsconfig.json]
{
  "compilerOptions": {
    "target": "ES5",
    "experimentalDecorators": true
  }
}
```

## Plain JS

To use `@wroud/di` without decorators, you can manually register class dependencies using `ServiceRegistry`. This method is just as effective and allows you to manage dependencies without relying on decorators.

```ts twoslash
import {
  createService,
  ServiceContainerBuilder,
  ServiceRegistry,
  single,
} from "@wroud/di";

interface ILoggerService {
  log(message: string): void;
}

const ILoggerService = createService<ILoggerService>("ILoggerService");

class ConsoleLoggerService implements ILoggerService {
  log(message: string) {
    console.log(message);
  }
}

class CounterService {
  constructor(private logger: ILoggerService) {}

  action() {
    this.logger.log("Action executed");
  }
}

function configure() {
  ServiceRegistry.register(CounterService, {
    name: "CounterService",
    dependencies: [single(ILoggerService)],
  });

  ServiceRegistry.register(ConsoleLoggerService, {
    name: "ConsoleLoggerService",
    dependencies: [],
  });

  const serviceProvider = new ServiceContainerBuilder()
    .addSingleton(CounterService)
    .addSingleton(ILoggerService, ConsoleLoggerService)
    .build();

  const counter = serviceProvider.getService(CounterService);
}
```

[Try it in the Playground](https://stackblitz.com/edit/wroud-di-no-decorators?file=src%2Fcounter.ts)
