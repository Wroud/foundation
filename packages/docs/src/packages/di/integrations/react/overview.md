---
outline: deep
---

# Dependency Injection for React

## Overview

`@wroud/di-react` extends the powerful `@wroud/di` library by providing seamless integration with React. It enables dependency injection (DI) in React applications through intuitive components and hooks, inspired by the .NET framework's DI system. This package is designed to simplify service management in React components while supporting modern JavaScript features, including hooks and Suspense for asynchronous service loading.

## Key Features

- **React Integration**: Provides React components and hooks for integrating `@wroud/di` into React applications.
- **Suspense for Lazy-Loaded Services**: Automatically leverages React Suspense to defer the resolution of asynchronous services until they are needed, optimizing performance in large applications.
- **Service Scoping**: Create service scopes dynamically for better lifecycle management in React components.
- **Small Bundle Size**: Lightweight package with minimal overhead, designed for React apps.
- **Easy to Use**: Designed for React developers with straightforward integration patterns.
- **Environment Compatibility**: Works with any React environment (browser, server-side rendering, etc.).

## Advanced Features

### Service Scoping in React

Service scoping allows you to create and manage service lifetimes dynamically within React components. Use `useServiceCreateScope` or `useServiceCreateAsyncScope` to manage scoped services in a parent-child component structure.

### Asynchronous Service Resolution

`@wroud/di-react` supports lazy loading of services, enhancing performance by only loading services when necessary. React's Suspense mechanism is used to handle these lazy-loaded services, deferring their resolution until the component requires them.

## Polyfills

For full compatibility, you may need the following polyfills in certain environments:

- **WeakMap**: For environments that do not natively support WeakMap.
- **Promise**: Required for environments lacking modern Promise support.
- **Dispose**: For managing explicit resource disposal. [Learn more](https://github.com/tc39/proposal-explicit-resource-management)
