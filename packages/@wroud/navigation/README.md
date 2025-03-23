# @wroud/navigation

[![ESM-only package][package]][esm-info-url]
[![NPM version][npm]][npm-url]

[package]: https://img.shields.io/badge/package-ESM--only-ffe536.svg
[esm-info-url]: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c
[npm]: https://img.shields.io/npm/v/@wroud/navigation.svg
[npm-url]: https://npmjs.com/package/@wroud/navigation

@wroud/navigation is a flexible, pattern-matching navigation system for JavaScript applications. It provides a framework-agnostic routing solution with powerful pattern matching capabilities, browser integration, and navigation state management.

## Features

- **Pattern-based Routing**: Built-in support for static routes, parameter segments (`/users/:id`), and wildcard patterns (`/files/:path*`).
- **Framework Agnostic**: Works with any JavaScript framework or vanilla JS.
- **Type Safety**: Written in TypeScript with full type inference for route parameters.
- **Navigation History**: Built-in navigation history management.
- **Browser Integration**: Optional browser URL synchronization.
- **Extensible**: Create custom navigation implementations for any environment.
- [Pure ESM package][esm-info-url]

## Installation

Install via npm:

```sh
npm install @wroud/navigation
```

Install via yarn:

```sh
yarn add @wroud/navigation
```

## Documentation

For detailed usage and API reference, visit the [documentation site](https://wroud.dev).

## Examples

### Basic Usage

```ts
import { Navigation, Router } from "@wroud/navigation";

// Create a router with default settings
const router = new Router();

// Add routes
router.addRoute({ id: "/" });
router.addRoute({ id: "/users" });
router.addRoute({ id: "/users/:id" });

// Create a navigation instance with the router
const navigation = new Navigation(router);

// Navigate to a route
await navigation.navigate({ id: "/users/:id", params: { id: "123" } });

// Get current route state
const currentState = navigation.getState();
console.log(currentState); // { id: "/users/:id", params: { id: "123" } }

// Go back to previous route
await navigation.goBack();
```

### Using Pattern Matching

```ts
import { Navigation, Router, TriePatternMatching } from "@wroud/navigation";

// Create a router with pattern matching
const router = new Router({
  matcher: new TriePatternMatching({ trailingSlash: false })
});

// Add routes
router.addRoute({ id: "/" });
router.addRoute({ id: "/app" });
router.addRoute({ id: "/app/users" });
router.addRoute({ id: "/app/users/:id" });

// Create a navigation instance
const navigation = new Navigation(router);

// Match a URL to a route
const match = router.matchUrl("/app/users/123");
console.log(match); // { id: "/app/users/:id", params: { id: "123" } }

// Build a URL from a route and parameters
const url = router.buildUrl("/app/users/:id", { id: "456" });
console.log(url); // "/app/users/456"

// Navigate using the pattern matching
await navigation.navigate(router.matchUrl("/app/users/789"));
```

### Browser Integration

```ts
import { Navigation, Router, TriePatternMatching } from "@wroud/navigation";
import { BrowserNavigation } from "@wroud/navigation/browser";

// Create a router with pattern matching
const router = new Router({
  matcher: new TriePatternMatching({
    trailingSlash: true,
    base: '/app' // Base path for the application
  })
});

// Add routes
router.addRoute({ id: "/" });
router.addRoute({ id: "/products" });
router.addRoute({ id: "/products/:id" });
router.addRoute({ id: "/blog/:year/:month/:slug" });

// Create a navigation instance
const navigation = new Navigation(router);

// Add a navigation listener for all navigation events
// including the initial navigation
const unsubscribe = navigation.addListener((type, from, to) => {
  if (type === "navigate" && !from) {
    console.log("Initial navigation:", to);
  } else {
    console.log(`Navigation: ${type}`, { from, to });
  }
});

// Create a browser navigation instance
const browserNavigation = new BrowserNavigation(navigation);

// Initialize browser navigation by registering routes
// This will sync with the browser's URL and history
await browserNavigation.registerRoutes();

// Navigate - this will update the browser URL
await navigation.navigate({ 
  id: "/products/:id", 
  params: { id: "123" } 
});

// Browser URL is now /app/products/123

// Later, remove the listener
unsubscribe();
```

### Protected Routes with Navigation Guards

```ts
import { Navigation, Router } from "@wroud/navigation";

// Create a router
const router = new Router();

// Add routes with navigation guards
router.addRoute({ 
  id: "/", 
});

router.addRoute({ 
  id: "/dashboard", 
  // Check if user is authenticated before activating this route
  canActivate: (to, from) => {
    return isAuthenticated(); // Your authentication check
  }
});

router.addRoute({ 
  id: "/editor/:documentId", 
  // Check if user has permission to edit this document
  canActivate: async (to, from) => {
    if (!to.params.documentId) return false;
    return await hasEditPermission(to.params.documentId);
  },
  // Ask for confirmation before navigating away
  canDeactivate: (to, from) => {
    return confirm("Discard unsaved changes?");
  }
});

const navigation = new Navigation(router);

// This will fail if not authenticated
await navigation.navigate({ id: "/dashboard", params: {} });
```

## Changelog

All notable changes to this project will be documented in the [CHANGELOG](./CHANGELOG.md) file.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details. 
