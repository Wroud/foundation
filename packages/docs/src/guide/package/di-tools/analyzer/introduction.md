---
outline: deep
---

# Introduction to `@wroud/di-tools-analyzer`

## Overview

`@wroud/di-tools-analyzer` is a powerful tool designed to enhance your experience with the `@wroud/di` dependency injection library. This tool provides capabilities to analyze the service container built with `@wroud/di`, allowing you to gain deeper insights into your application's dependency graph.

## Key Features

- **Data Collection**: Collects detailed information about the service container in a serializable JSON format.
- **Visualization**: Utilizes D3.js to visualize the collected data, making it easier to understand the relationships and dependencies between services.
- **Integration**: Seamlessly integrates with `@wroud/di`, providing an easy-to-use interface for analyzing and visualizing your service container.

## Why Use `@wroud/di-tools-analyzer`?

1. **Enhanced Understanding**: Visualizing your dependency graph helps you better understand how your services are interconnected, which is crucial for debugging and optimizing your application.
2. **Performance Optimization**: By analyzing the service container, you can identify potential performance bottlenecks and optimize your service resolutions.
3. **Documentation**: The tool provides a clear, visual representation of your service container, which can be used for documentation and onboarding new team members.

## How It Works

`@wroud/di-tools-analyzer` works by hooking into the `@wroud/di` service container and collecting metadata about the registered services and their dependencies. This data is then transformed into a JSON format that can be easily consumed and visualized using D3.js.

## Getting Started

To start using `@wroud/di-tools-analyzer`, follow these simple steps:

### Installation

Install the `@wroud/di-tools-analyzer` package via npm or yarn.

::: code-group

```sh [npm]
npm install @wroud/di-tools-analyzer
```

```sh [yarn]
yarn add @wroud/di-tools-analyzer
```

```sh [pnpm]
pnpm add @wroud/di-tools-analyzer
```

```sh [bun]
bun add @wroud/di-tools-analyzer
```

:::

### Setup

Integrate `@wroud/di-tools-analyzer` with your existing `@wroud/di` setup.

```javascript
import { ServiceContainerBuilder } from "@wroud/di";
import { getDependenciesGraph } from "@wroud/di-tools-analyzer";

const builder = new ServiceContainerBuilder();
// Register your services

const data = await getDependenciesGraph(builder);
```

#### Clusters based on Modules

You can visualize clusters from ModuleRegistry

```javascript
import { ServiceContainerBuilder, ModuleRegistry } from "@wroud/di";
import {
  getDependenciesGraph,
  ServiceCollectionProxy,
} from "@wroud/di-tools-analyzer";

const builder = new ServiceContainerBuilder();
const builderProxy = new ServiceCollectionProxy(builder); // [!code ++]

for (const module of ModuleRegistry) {
  await module.configure(builder); // [!code --]
  await module.configure(builderProxy.proxy(module.name)); // [!code ++]
}

const data = await getDependenciesGraph(builder); // [!code --]
const data = await getDependenciesGraph(builder, builderProxy); // [!code ++]
```

### Visualization

Use the collected data to create visualizations.

```javascript
import { createChart } from "@wroud/di-tools-analyzer";

const svg = document.createElement("svg");
const width = 512;
const height = 512;
const chart = createChart(svg, width, height);
chart.update(data);
```

### Basic Usage Example

Here is a basic usage example of the analyzer integrated with D3.js for visualization:

```javascript
import { ServiceContainerBuilder } from "@wroud/di";
import { createChart, getDependenciesGraph } from "@wroud/di-tools-analyzer";

// Assume htmlSvgElement, width, and height are predefined
const chart = createChart(htmlSvgElement, width, height); // Initialize D3.js
const builder = new ServiceContainerBuilder();
// Register your services
const graph = await getDependenciesGraph(builder); // Collect information about dependencies, data can be serialized with JSON.stringify()
chart.update(graph); // Render graph
```

## Conclusion

`@wroud/di-tools-analyzer` is an essential tool for developers using the `@wroud/di` library. It not only helps in understanding and optimizing your service container but also provides valuable visual documentation of your application's dependencies.

For detailed usage examples and API documentation, refer to the [official documentation](#).
