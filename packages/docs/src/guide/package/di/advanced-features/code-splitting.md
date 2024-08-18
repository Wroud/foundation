---
outline: deep
---

# Code Splitting

@wroud/di introduces the ability to load services asynchronously, enabling advanced features like code-splitting and lazy-loading. This feature is designed to improve the flexibility and performance of applications by allowing services to be loaded only when they are needed, rather than at startup.

### When to Use Asynchronous Loading

Asynchronous service loading is most beneficial in scenarios where large portions of your application are not immediately needed at startup. Here are some guidelines to help you decide when to use it:

- **Modular Applications**: If your application is divided into clearly defined modules, such as different user roles or sections, consider lazy-loading the services for these modules.
- **Rarely Used Features**: Features that are rarely accessed by users, such as advanced settings or administration panels, are prime candidates for lazy loading.
- **Performance Bottlenecks**: If you identify that your application’s initial load time is a performance bottleneck, consider adopting asynchronous loading for non-critical services.

### How It Works

To make a service's implementation lazy, use the `lazy` function provided by `@wroud/di`. This function wraps the dynamic `import` statement, allowing the service to be loaded asynchronously. Here’s an example:

```typescript
import { lazy, ServiceContainerBuilder } from "@wroud/di";
import { IAdministration } from "./Administration/IAdministration";

const builder = new ServiceContainerBuilder();

builder.addSingleton(
  IAdministration,
  lazy(() =>
    import("./Administration/Administration").then((m) => m.Administration),
  ),
);
```

[Try it in the Playground](https://stackblitz.com/edit/wroud-di-code-splitting?file=src%2Fcounter.ts)

In this example, the `IAdministration` service is loaded only when it is needed, using the asynchronous method `getServiceAsync` or `getServicesAsync` of `IServiceProvider`.

### Requirements

Asynchronous service loading relies on the dynamic `import` feature, which is not supported in all environments. If your environment does not support dynamic `import`, you must use the standard synchronous approach to load services.

### Benefits

- **Performance Optimization**: By loading services asynchronously, you can improve the initial load time of your application, particularly in large or modular applications.
- **Modular Design**: Asynchronous loading encourages a modular design, allowing you to separate concerns and load only what is necessary at any given time.

## Error Handling and Validation

When working with asynchronous service loading in `@wroud/di`, error handling is crucial to ensure the reliability of your application. The good news is that error handling for asynchronous services follows the same patterns as synchronous services, making it straightforward to integrate.

### Error Handling

Asynchronous service loading errors are handled in the same way as errors in the synchronous approach. The key difference is that when loading services asynchronously, you’ll need to manage promises and potential issues that might arise during the dynamic `import` process.

For example, if a service fails to load due to an error in the `import` statement, this error will be caught in the usual manner with a `try-catch` block or by handling the promise rejection:

```typescript
try {
  const adminService = await serviceProvider.getServiceAsync(IAdministration);
} catch (error) {
  console.error("Failed to load administration service:", error);
}
```

This approach ensures that your application can gracefully handle failures in service loading, providing a fallback or logging the error for further analysis.

### Validation of Circular Dependencies

A unique challenge with asynchronous service loading is that circular dependencies cannot be detected at the time of service registration. This is because the dependencies might not be fully resolved when you add services to the `ServiceContainerBuilder`.

To address this, `@wroud/di` provides a `validate` method on the `ServiceContainerBuilder` class. This method allows you to verify that there are no circular dependencies among your services before you build the service container:

```typescript
const builder = new ServiceContainerBuilder();

// Register services
builder.addSingleton(IAdministration /* lazy loading setup */);

// Validate circular dependencies
await builder.validate();

// Build the service container
const serviceProvider = builder.build();
```

::: warning
The `validate` method is asynchronous and should be awaited. This method will load all implementations, so it is not recommended to use it in production.
:::

### Development Environment Warnings

In development environments, if the `validate` method is not called before invoking the `build()` method, `@wroud/di` will emit warnings in the console about potential undetected circular dependencies. These warnings serve as a reminder to validate your service configuration to avoid runtime issues.

## Migration Guide

With the introduction of asynchronous service loading in `@wroud/di`, you might wonder how this affects your existing codebase. Fortunately, migrating to take advantage of this new feature is straightforward and does not involve any breaking changes.

### No Breaking Changes

The asynchronous service loading feature is fully compatible with previous versions of `@wroud/di`. This means that all your existing services, configured and loaded synchronously, will continue to work as expected. You can gradually adopt asynchronous loading in parts of your application where it makes sense, without needing to refactor your entire codebase.

### Adopting Asynchronous Service Loading

To start using asynchronous service loading, you can follow these simple steps:

1. **Identify Candidates for Lazy Loading**:

   - Review your application to identify services that can benefit from lazy loading. These are typically services that are part of non-essential modules, large features, or sections of your application that are not immediately needed on startup.

2. **Refactor Service Registration**:

   - For each service that you want to load asynchronously, modify its registration in the `ServiceContainerBuilder` to use the `lazy` function with dynamic `import`. Here’s an example of how to refactor a service:

     ```typescript
     import { lazy, ServiceContainerBuilder } from "@wroud/di";
     import { IAdministration } from "./Administration/IAdministration";

     const builder = new ServiceContainerBuilder();

     builder.addSingleton(
       IAdministration,
       lazy(() =>
         import("./Administration/Administration").then(
           (m) => m.Administration,
         ),
       ),
     );
     ```

3. **Update Service Resolution**:

   - When you resolve these services in your application, use the asynchronous methods `getServiceAsync` or `getServicesAsync` provided by `IServiceProvider`. This ensures that your application waits for the service to be loaded before it is used:

     ```typescript
     const adminService =
       await serviceProvider.getServiceAsync(IAdministration);
     ```

4. **Testing and Validation**:
   - After refactoring, thoroughly test your application to ensure that the services are loaded as expected. Use the `validate` method of `ServiceContainerBuilder` in your development environment to check for circular dependencies.

### Best Practices

- **Gradual Adoption**: Start by lazy loading non-critical services or those that are part of large, infrequently used modules. This allows you to gradually introduce asynchronous loading without overwhelming your development process.
- **Consistency in Service Resolution**: Once you decide to load a service asynchronously, ensure that all resolutions of this service use the asynchronous methods to avoid runtime errors.

- **Performance Monitoring**: Keep an eye on performance, particularly the loading times of asynchronously loaded services, to ensure that lazy loading is providing the expected benefits.

## Performance Considerations

Introducing asynchronous service loading in `@wroud/di` can have a significant impact on the performance of your application. While this feature offers powerful benefits like code-splitting and lazy-loading, it’s important to understand how to use it effectively to optimize performance without introducing latency or complexity.

### Initial Load Time

One of the primary benefits of asynchronous service loading is the potential to reduce the initial load time of your application. By deferring the loading of services that are not immediately needed, you can decrease the amount of code that must be executed at startup. This can be particularly beneficial in large applications with multiple modules or sections.

### Example Scenario

Consider an application with distinct "public" and "administration" sections. The administration section is only accessible to users with specific rights. By lazily loading the services related to the administration section, you can significantly reduce the amount of code that needs to be loaded and executed when a general user accesses the public section.

### Trade-offs and Considerations

While asynchronous service loading can improve performance, it’s important to be aware of potential trade-offs:

- **Load Time vs. Execution Time**: Lazy-loading services can reduce initial load time, but it may introduce slight delays when these services are eventually needed. This is because the services will be loaded asynchronously when requested, which could add latency to user interactions.

- **Circular Dependencies**: As mentioned in the [Error Handling and Validation](#error-handling-and-validation) section, circular dependencies are harder to detect in an asynchronous context. This makes it essential to validate your service configuration during development.

### Monitoring and Optimization

After implementing asynchronous service loading, it’s crucial to monitor the performance of your application to ensure that it’s providing the expected benefits. Use performance profiling tools to measure load times and identify any new bottlenecks introduced by lazy-loading services. If necessary, refine your lazy-loading strategy by adjusting which services are loaded asynchronously and when.
