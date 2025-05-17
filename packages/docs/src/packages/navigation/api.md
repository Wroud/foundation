---
outline: deep
---

# API

This section summarizes the main classes exported by `@wroud/navigation`.
For complete type information, see the bundled TypeScript declarations.

## Navigation

Manages the current route state and history.

### Methods

- `navigate(state: IRouteState): Promise<void>` – navigate to a route state.
- `replace(state: IRouteState): Promise<void>` – replace the current state.
- `goBack(): Promise<void>` – go back in history.
- `addListener(fn)` – subscribe to navigation events.

## Router

Defines and matches application routes.

### Methods

- `addRoute(route: IRoute)`: register a new route definition.
- `matchUrl(url: string): IRouteState | null`: match a URL to a route.
- `buildUrl(id: string, params?): string`: build a URL from an id and params.

## BrowserNavigation

Synchronizes navigation with the browser's URL and history.

### Methods

- `registerRoutes(): Promise<void>` – start listening to browser events and restore initial state.
- `dispose(): void` – remove listeners and clean up.

## Pattern Matching

`TriePatternMatching` provides the default implementation used by `Router` for flexible route patterns.
