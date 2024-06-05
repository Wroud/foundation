---
outline: deep
---

# Usage

This guide will show you how to use the `@wroud/di` library in different setups: with modern decorators (stage 3), legacy decorators (stage 2), and plain JavaScript. Each section provides configuration tips and example code to help you get started quickly.

## Decorators (stage 3)

To use the latest decorator features in `@wroud/di`, you can utilize the stage 3 decorators. The `@injectable` decorator allows you to specify class constructor dependencies so they can be automatically injected by the DI system.

```ts twoslash
import { injectable } from '@wroud/di';

@injectable()
class Logger {
  log(message: string) {
    console.log(message);
  }
}

@injectable(() => [Logger])
class Service {
  constructor(private readonly logger: Logger) { }

  action() {
    this.logger.log('Action executed');
  }
}
```

[TypeScript Documentation](https://devblogs.microsoft.com/typescript/announcing-typescript-5-0/#decorators)

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

#### Vite
```ts
import { defineConfig } from "vite";
import swc from "unplugin-swc";

export default defineConfig({
  plugins: [
    swc.vite({
      jsc: {
        parser: {
          syntax: "typescript",
          decorators: true,
        },
        transform: {
          decoratorMetadata: true,
          decoratorVersion: "2022-03",
          react: {
            runtime: "automatic",
          },
        },
      },
    }),
  ],
});
```

[Vite live example](https://stackblitz.com/edit/wroud-di-decorators?file=src%2Fcounter.ts)

### Migration from Legacy Decorators (stage 2)

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

You might need to install `tslib` if your target environment does not support decorators.

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

[TypeScript Documentation](https://www.typescriptlang.org/docs/handbook/decorators.html)

### Configuration

Enable legacy decorators in your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES5",
    "experimentalDecorators": true
  }
}
```

[Vite live example](https://stackblitz.com/edit/wroud-di-legacy-decorators?file=src%2Fcounter.ts)

## Plain JS

To use `@wroud/di` without decorators, you can manually register class dependencies using `ServicesRegistry`. This method is just as effective and allows you to manage dependencies without relying on decorators.

```ts twoslash
import { 
  createService,
  ServiceContainerBuilder,
  ServicesRegistry
} from '@wroud/di';

function configure() {
  ServicesRegistry.register(CounterService, {
    name: 'CounterService',
    dependencies: [ILoggerService],
  });

  ServicesRegistry.register(ConsoleLoggerService, {
    name: 'ConsoleLoggerService',
    dependencies: [],
  });

  const serviceProvider = new ServiceContainerBuilder()
    .addSingleton(CounterService)
    .addSingleton(ILoggerService, ConsoleLoggerService)
    .build();

  const counter = serviceProvider.getService(CounterService);
}

interface ILoggerService {
  log(message: string): void;
}

const ILoggerService = createService<ILoggerService>('ILoggerService');

class ConsoleLoggerService implements ILoggerService {
  log(message: string) {
    console.log(message);
  }
}

class CounterService {
  value: number;
  private listeners: Array<(value: number) => void>;
  constructor(private logger: ILoggerService) {
    this.value = 0;
    this.listeners = [];
  }

  increment() {
    this.value++;
    this.logger.log(`count is ${this.value}`);
    for (const listener of this.listeners) {
      listener(this.value);
    }
  }

  addListener(fn: (value: number) => void) {
    this.listeners.push(fn);
  }
}
```

[Vite live example](https://stackblitz.com/edit/wroud-di-no-decorators?file=src%2Fcounter.ts)
