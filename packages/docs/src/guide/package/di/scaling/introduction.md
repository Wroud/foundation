---
outline: deep
---

# Introduction to Scaling Your Application with @wroud/di

Scaling applications efficiently can often present challenges, especially when using dependency injection (DI) frameworks. One of the common issues developers face is managing and registering dependencies across different modules and ensuring these dependencies are available when needed. As your application grows, maintaining a scalable and manageable DI setup becomes crucial.

With @wroud/di, these scaling issues are not as significant as they might seem. The framework provides a robust solution to manage and register modules through its `ModuleRegistry` class. This powerful tool ensures your application remains modular and your dependencies are well-organized and accessible.

## Common Problems with Scaling Applications Using Dependency Injection

1. **Module Management**: Keeping track of numerous modules and their dependencies can become cumbersome.
2. **Dependency Registration**: Ensuring that all necessary dependencies are registered correctly and available throughout the application lifecycle.
3. **Initialization Phase Tracking**: Managing the initialization phase to ensure dependencies are registered before they are required.
4. **Manual Configuration**: The need to manually configure and add modules to the DI container, which can be error-prone if not handled correctly.

## Solutions with @wroud/di

@wroud/di provides several mechanisms to alleviate these issues and streamline the scaling process:

- **ModuleRegistry**: A static class that manages module registration and access.
- **Automatic Module Tracking**: Listeners that help track modules registered after the DI container is built, ensuring correct initialization.
- **Modular Approach**: Encourages a modular approach by using package names as module identifiers, simplifying module management in a monorepo setup.
- **Side Effects Management**: Using `sideEffects` in `package.json` to ensure modules are registered correctly when imported.

By leveraging these features, you can build a scalable and maintainable DI setup that grows with your application.

## Analyzing Dependencies with @wroud/di-tools-analyzer

To further assist with scaling your application, @wroud/di-tools-analyzer can be used to analyze dependencies. This tool provides methods to collect dependency data in a serializable format (JSON) and visualize this data using D3.js. By analyzing your dependencies, you can identify potential issues and optimize your DI configuration, making it easier to scale your application effectively.

In the following sections, we will explore how to implement and utilize the `ModuleRegistry` class, manage module registration, and ensure your application scales effectively with @wroud/di.
