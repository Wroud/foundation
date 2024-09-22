---
outline: deep
---

# Usage

This page provides a practical example of how to use `@wroud/di-react` for dependency injection in a React application. We’ll walk through setting up a service container, resolving services using React hooks, and leveraging lazy loading with React Suspense for improved performance.

## Setting Up the Service Container

To begin, we create a service container using `ServiceContainerBuilder` from `@wroud/di`. This allows us to register services that will be injected later into our React components.

```tsx twoslash
import { ServiceContainerBuilder } from "@wroud/di";
import { ServiceProvider } from "@wroud/di-react";

// Create the service container
const builder = new ServiceContainerBuilder();

// Example service
class Logger {
  log(message: string) {
    console.log(message);
  }
}

// Register the service as a singleton
builder.addSingleton(Logger);

// Build the service provider
const serviceProvider = builder.build();
```

## Providing Services in React

Next, we use the `ServiceProvider` component to wrap the application, making the registered services available throughout the component tree.

```tsx
import React from "react";
import { ServiceProvider } from "@wroud/di-react";
import AppContent from "./AppContent";

function App() {
  return (
    <ServiceProvider provider={serviceProvider}>
      <AppContent />
    </ServiceProvider>
  );
}

export default App;
```

## Resolving Services with `useService`

Within your components, you can resolve services using the `useService` hook. Here’s an example where the `Logger` service is used in a component:

```tsx
import React from "react";
import { useService } from "@wroud/di-react";
import Logger from "./Logger";

function AppContent() {
  const logger = useService(Logger);

  function handleClick() {
    logger.log("Button clicked!");
  }

  return <button onClick={handleClick}>Click me!</button>;
}

export default AppContent;
```

## Lazy Loading Services with React Suspense

`@wroud/di-react` supports lazy loading of services, allowing you to defer the loading of large or rarely used services until they are needed. This is especially useful for improving performance in larger applications. React's Suspense mechanism is automatically used to handle loading states.

Here’s an example of how to set up lazy-loaded services using `@wroud/di`'s `lazy` method:

```tsx
import { lazy, ServiceContainerBuilder } from "@wroud/di";
import { CounterService } from "./CounterService";
import { ILoggerService } from "./ILoggerService";
import { ConsoleLoggerService } from "./ConsoleLogService";
import { IAdministrationService } from "./administration/IAdministrationService";

// Create the service provider with lazy-loaded services
export function createServiceProvider() {
  const serviceProvider = new ServiceContainerBuilder()
    .addSingleton(CounterService)
    .addSingleton(ILoggerService, ConsoleLoggerService)
    .addSingleton(
      IAdministrationService,
      lazy(() =>
        import("./administration/AdministrationService").then(
          (m) => m.AdministrationService,
        ),
      ),
    )
    .build();

  return serviceProvider;
}
```

[Try it in the Playground](https://stackblitz.com/edit/wroud-di-react-lazy?file=src%2Fservices%2FcreateServiceProvider.ts)

In this example, the `AdministrationService` is lazily loaded. When the `IAdministrationService` is requested via `useService`, the loading will be handled using React Suspense, showing a fallback UI while the service is being loaded.

To resolve the lazy-loaded service in a component, you can use `useService`, and React Suspense will automatically handle the asynchronous nature of the service:

```tsx
import React, { Suspense } from "react";
import { useService, ServiceProvider } from "@wroud/di-react";
import { IAdministrationService } from "./administration/IAdministrationService";
import { createServiceProvider } from "./createServiceProvider";

const serviceProvider = createServiceProvider();

function AdministrationComponent() {
  const adminService = useService(IAdministrationService);

  return <div>{adminService.getAdminData()}</div>;
}

function App() {
  return (
    <Suspense fallback={<div>Loading administration service...</div>}>
      <ServiceProvider provider={serviceProvider}>
        <AdministrationComponent />
      </ServiceProvider>
    </Suspense>
  );
}

export default App;
```
