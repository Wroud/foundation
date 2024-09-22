---
outline: deep
---

# API

This article provides an overview of the main API for the `@wroud/di-react` package. It explains the key components and hooks available for managing dependency injection in React applications.

## ServiceProvider

The `ServiceProvider` component is used to supply a service provider context to child components, enabling them to resolve services.

### Props

- **`provider: IServiceProvider`**

  - The service provider instance used to resolve services within the component tree.

### Example

```tsx
import { ServiceProvider } from "@wroud/di-react";
import { Main } from "./Main.js";
import { getServiceProvider } from "./getServiceProvider.js";

export function App() {
  return (
    <ServiceProvider provider={getServiceProvider()}>
      <Main />
    </ServiceProvider>
  );
}
```

## useService

The `useService` hook is used to resolve a single service instance. If the service is lazy-loaded, React's Suspense mechanism will handle its resolution.

### Arguments

- **`type: SingleServiceType<T>`**

  - The service type to resolve.

### Example

```tsx
import { useService } from "@wroud/di-react";
import Logger from "./Logger.js";

function SomeComponent() {
  const logger = useService(Logger);

  function handleClick() {
    logger.log("Hello World!");
  }

  return (
    <button type="button" onClick={handleClick}>
      Click me!
    </button>
  );
}
```

## useServices

The `useServices` hook is used to resolve multiple instances of a service. Like `useService`, it utilizes React's Suspense mechanism to handle lazy-loaded services.

### Arguments

- **`type: SingleServiceType<T>`**

  - The service type to resolve.

### Example

```tsx
import { useServices } from "@wroud/di-react";
import Logger from "./Logger.js";

function SomeComponent() {
  const loggers = useServices(Logger);

  function handleClick() {
    loggers.forEach((logger) => {
      logger.log("Hello World!");
    });
  }

  return (
    <button type="button" onClick={handleClick}>
      Click me!
    </button>
  );
}
```

## useServiceCreateAsyncScope

The `useServiceCreateAsyncScope` hook creates an asynchronous service scope. It requires a `ServiceProvider` to be present in the parent components to function properly.

### Example

```tsx
import { useServiceCreateAsyncScope, ServiceProvider } from "@wroud/di-react";

function SomeComponent() {
  const scopeServiceProvider = useServiceCreateAsyncScope();

  return <ServiceProvider provider={scopeServiceProvider}>...</ServiceProvider>;
}
```

## useServiceCreateScope

The `useServiceCreateScope` hook creates a new service scope. Similar to `useServiceCreateAsyncScope`, it requires a `ServiceProvider` in the parent components.

### Example

```tsx
import { useServiceCreateScope, ServiceProvider } from "@wroud/di-react";

function SomeComponent() {
  const scopeServiceProvider = useServiceCreateScope();

  return <ServiceProvider provider={scopeServiceProvider}>...</ServiceProvider>;
}
```

---

This overview provides a quick reference to the key components and hooks in the `@wroud/di-react` package. For more detailed information, please refer to the full documentation.
