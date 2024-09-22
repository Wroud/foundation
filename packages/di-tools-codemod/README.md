# @wroud/di-tools-codemod <!--t-->

Welcome to `@wroud/di-tools-codemod`, a tool designed to help you migrate your codebase from Inversify to `@wroud/di` effortlessly. This codemod automates the transformation process, ensuring a smooth transition to `@wroud/di`.

## Features

- **Automated Migration**: Converts your existing Inversify code to use `@wroud/di`.
- **Configuration Support**: Allows customization through a `di-tools-codemod.json` configuration file.

## Installation

### npm

```sh
npm install @wroud/di-tools-codemod
```

Install via yarn

```sh
yarn add @wroud/di-tools-codemod
```

## Usage

To use the codemod, run the following command in your terminal:

```sh
yarn di-tools-codemod ./packages/*/src/**/*.{ts,tsx}
```

### Configuration

You can provide a `di-tools-codemod.json` configuration file in the same folder where you run the codemod to customize the migration process.

```json
{
  "transformer": {
    "esm": false,
    "copyright": ""
  },
  "supportedPackages": [
    {
      "name": "inversify",
      "replace": "@wroud/di",
      "injectableDecorator": "injectable",
      "injectDecorator": "inject",
      "multiInjectDecorator": "multiInject"
    }
  ],
  "generateModule": true
}
```

## Example

### Before

```ts
import { injectable } from "inversify";

@injectable()
export class NotificationService {
  constructor(
    private readonly a: A,
    private readonly b: B,
    private readonly c: C,
  ) {}
}
```

### After

```ts
import { injectable } from "@wroud/di";

@injectable(() => [A, B, C])
export class NotificationService {
  constructor(
    private readonly a: A,
    private readonly b: B,
    private readonly c: C,
  ) {}
}
```

## Changelog

All notable changes to this project will be documented in the [CHANGELOG](./CHANGELOG.md) file.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
