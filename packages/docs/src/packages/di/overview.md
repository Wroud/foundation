---
outline: deep
---

## Overview

`@wroud/di` is a powerful dependency injection (DI) library inspired by the .NET framework and implemented in pure JavaScript. It leverages modern JavaScript features, including optional decorators and explicit resource management, to provide a robust and flexible DI system suitable for a wide range of applications. It also supports legacy decorators from TypeScript, ensuring broad compatibility.

## Key Features

- **Small Bundle Size**: Only 5kB (minified), ensuring minimal overhead.
- **Flexible DI**: Supports multiple service injections, disposals, and various lifetimes.
- **Modern Decorators**: Clean and maintainable code with powerful decorators.
- **Service Lifetimes**: Singleton, transient, and scoped lifetimes.
- **Ease of Use**: Quick start without extensive knowledge.
- **Environment Compatibility**: Works in any JavaScript environment (browser, Node.js, etc.).

## Advanced Features

### Multiple Service Injection

Inject multiple services seamlessly for flexible dependency management.

### Resource Management and Disposal

Efficiently manage and dispose of services, adhering to TC39 proposal for explicit resource management, ensuring predictable resource handling and proper cleanup.

### Decorator Support

Optional use of TC39 proposal-decorators (stage 3) for intuitive dependency management. Also supports legacy decorators from TypeScript for broad compatibility.

## Polyfills

You may need the following polyfills for full compatibility:

- **Decorators**: Required for environments without native decorator support. [Learn more](https://github.com/tc39/proposal-decorators)
- **WeakMap**: For environments that do not support WeakMap.
- **Promise**: For environments that do not support modern Promises.
- **Dispose**: For explicit resource management. [Learn more](https://github.com/tc39/proposal-explicit-resource-management)
