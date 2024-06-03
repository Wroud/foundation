---
outline: deep
---

# Installation

<Badges name="@wroud/di" />

Install with npm, or check [CDN Usage](#cdn-usage) for other options:

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

## Usage

### Shorthands

The `@wroud/di` package includes handy shorthand methods. For example, `addSingleton` makes it easy to register a singleton service. Here's a quick example:

```ts twoslash
import { ServiceContainerBuilder } from '@wroud/di'

const builder = new ServiceContainerBuilder();

class Logger {
  log(message: string) {
    console.log(message);
  }
}

builder.addSingleton(Logger);

const serviceProvider = builder.build();

const logger = serviceProvider.getService(Logger);
logger.log('Hello world!');
// -> Hello world!
```

### CJS Usage

`@wroud/di` is an ESM-only package, which keeps it small. But you can still use it in CJS by dynamically importing the ESM module in Node.js.

```ts twoslash
async function main() {
  const { ServiceContainerBuilder } = await import('@wroud/di')

  const builder = new ServiceContainerBuilder();

  class Logger {
    log(message: string) {
      console.log(message);
    }
  }

  builder.addSingleton(Logger);

  const serviceProvider = builder.build();

  const logger = serviceProvider.getService(Logger);
  logger.log('Hello world!');
  // -> Hello world!
}
```

### CDN Usage

To use `@wroud/di` in the browser through a CDN, use [esm.run](https://esm.run) or [esm.sh](https://esm.sh).

```html theme:rose-pine
<body>
  <script type="module">
    // Specify the exact version
    import { ServiceContainerBuilder } from 'https://esm.sh/@wroud/di@1.0.0'
    // or
    // import { ServiceContainerBuilder } from 'https://esm.run/@wroud/di@1.0.0'

    const builder = new ServiceContainerBuilder();

    class Logger {
      log(message: string) {
        console.log(message);
      }
    }

    builder.addSingleton(Logger);

    const serviceProvider = builder.build();

    const logger = serviceProvider.getService(Logger);
    logger.log('Hello world!');
    // -> Hello world!
  </script>
</body>
```
