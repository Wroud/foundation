# @wroud/react-reactive-value

[![ESM-only package][package]][esm-info-url]
[![NPM version][npm]][npm-url]

[package]: https://img.shields.io/badge/package-ESM--only-ffe536.svg
[esm-info-url]: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c
[npm]: https://img.shields.io/npm/v/@wroud/react-reactive-value.svg
[npm-url]: https://npmjs.com/package/@wroud/react-reactive-value

@wroud/react-reactive-value is a lightweight library for managing reactive values in React applications. It provides a simple and efficient way to create and use reactive state that automatically triggers re-renders when values change.

## Features

- **React Integration**: Seamlessly integrates with React components for automatic updates.
- **Performance Optimized**: Minimizes unnecessary re-renders through smart dependency tracking.
- **TypeScript**: Written in TypeScript for type safety.
- **Lightweight**: Small bundle size with zero dependencies.
- [Pure ESM package][esm-info-url]

## Installation

Install via npm:

```sh
npm install @wroud/react-reactive-value
```

Install via yarn:

```sh
yarn add @wroud/react-reactive-value
```

## Documentation

For detailed usage and API reference, visit the [documentation site](https://wroud.dev).

## Example

```tsx
import { useCreateReactiveValue, useReactiveValue } from "@wroud/react-reactive-value";
import { useState, createContext, useContext } from "react";

// Create a counter store outside of components
function createCounterStore() {
  // Private state
  let count = 0;
  const listeners = new Set<() => void>();
  
  // Notify listeners when state changes
  const notifyListeners = () => {
    listeners.forEach(listener => listener());
  };
  
  // Public API
  return {
    getValue: () => count,
    increment: () => {
      count++;
      notifyListeners();
    },
    subscribe: (onValueChange: () => void) => {
      listeners.add(onValueChange);
      return () => {
        listeners.delete(onValueChange);
      };
    }
  };
}

// Create a context to share the reactive value
const CounterContext = createContext(null);

// Provider component that creates the reactive value
function CounterProvider({ children }) {
  // Create a singleton store
  const counterStore = useState(() => createCounterStore())[0];
  
  // Create reactive value from the store
  const counter = useCreateReactiveValue(
    // Getter function
    () => counterStore.getValue(),
    // Subscribe function
    (onValueChange) => counterStore.subscribe(onValueChange),
    [counterStore] // Dependencies
  );
  
  return (
    <CounterContext.Provider value={{ counter, counterStore }}>
      {children}
    </CounterContext.Provider>
  );
}

// Consumer component that uses the reactive value
function CounterDisplay() {
  // Get the reactive value from context
  const { counter } = useContext(CounterContext);
  
  // Use the reactive value in the component
  const count = useReactiveValue(counter);
  
  return <p>Count: {count}</p>;
}

// Consumer component that updates the value
function CounterControls() {
  // Get the store from context
  const { counterStore } = useContext(CounterContext);
  
  return (
    <button onClick={() => counterStore.increment()}>
      Increment
    </button>
  );
}

// Main component that composes the application
function CounterApp() {
  return (
    <CounterProvider>
      <div>
        <CounterDisplay />
        <CounterControls />
      </div>
    </CounterProvider>
  );
}
```

## Changelog

All notable changes to this project will be documented in the [CHANGELOG](./CHANGELOG.md) file.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details. 
