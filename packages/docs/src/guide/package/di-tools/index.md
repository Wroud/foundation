---
outline: deep
---

# DI Tools

## Introduction

`@wroud/di` is not just a dependency injection library; it also comes with a suite of tools designed to help you analyze and visualize your application's dependency graph. These tools provide deeper insights into how your services are interconnected, aiding in debugging, optimization, and documentation.

## Available Tools

### [`@wroud/di-tools-analyzer`](./analyzer/introduction)

`@wroud/di-tools-analyzer` is a powerful tool that integrates seamlessly with `@wroud/di`. It provides the following capabilities:

- **Data Collection**: Collects detailed information about the service container in a serializable JSON format.
- **Visualization**: Utilizes D3.js to visualize the collected data, making it easier to understand the relationships and dependencies between services.

By using `@wroud/di-tools-analyzer`, developers can better understand their service container, identify potential performance bottlenecks, and generate visual documentation of their application's dependencies.

## Conclusion

The `DI Tools` suite enhances the capabilities of the `@wroud/di` library by providing tools for analyzing and visualizing the dependency graph. These tools are essential for gaining deeper insights into your application's architecture and improving the overall development workflow.
