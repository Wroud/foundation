# @wroud/navigation

[![ESM-only package][package]][esm-info-url]
[![NPM version][npm]][npm-url]

[package]: https://img.shields.io/badge/package-ESM--only-ffe536.svg
[esm-info-url]: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c
[npm]: https://img.shields.io/npm/v/@wroud/navigation.svg
[npm-url]: https://npmjs.com/package/@wroud/navigation

@wroud/navigation is a flexible, pattern-matching navigation system for JavaScript applications. It provides a framework-agnostic routing solution with powerful pattern matching capabilities, browser integration, and navigation state management.

## Features

- **Pattern-based Routing**: Built-in support for static routes, parameter segments (`/users/:id`), wildcard patterns (`/files/:path*`), and query parameters (`/search?q=:query&page=:page<number>`).
- **Framework Agnostic**: Works with any JavaScript framework or vanilla JS.
- **Type Safety**: Written in TypeScript with full type inference for route parameters, including typed parameters (`<number>`, `<boolean>`, `<date>`, `<json>`), optional/required query params (`!` suffix), and wildcard arrays.
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

// History is a cursor over keyed entries, like the browser's
console.log(navigation.entries); // [{ key, state: { id: "/users/:id", ... } }]
console.log(navigation.canGoBack, navigation.canGoForward);

// Move the cursor; entries ahead of it are kept until the next navigate()
await navigation.goBack();
await navigation.goForward();
await navigation.go(-1);
await navigation.traverseTo(navigation.entries[0]!.key);

// navigate/replace/goBack/goForward/go/traverseTo resolve to false
// when a route guard refuses the navigation
const moved = await navigation.navigate({ id: "/users", params: {} });
```

### Applied and finished

Every call — `navigate()`, `replace()`, `go()`, `goBack()`, `goForward()`, `traverseTo()` — has two moments:

- The call resolves `true` once the entry is applied and every listener has been invoked. Listeners are invoked
  synchronously, in registration order, in the tick the entry is applied; a listener that returns a promise holds
  neither the caller nor the other listeners.
- `transition.finished`, the promise a platform receives in `commit()`, resolves once every listener has settled. It
  never rejects: a listener that throws or rejects is reported with `console.error` and the others still run.

A listener that renders asynchronously therefore holds `finished`, never the caller: a UI action awaits `navigate()`
for the outcome of the guards and the placement of the entry, and a platform waits for `finished` before it scrolls or
tells the browser the navigation is done. A guard that awaits its own redirect resolves at the redirect's apply. A
consumer without a platform that needs "listeners settled" awaits its own listener's promise; there is no extra API
for that.

### Using Pattern Matching

```ts
import { Navigation, Router, TriePatternMatching } from "@wroud/navigation";

// Create a router with pattern matching
const router = new Router({
  matcher: new TriePatternMatching({ trailingSlash: false }),
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

### Query Parameters and Typed Params

```ts
import { Router, TriePatternMatching } from "@wroud/navigation";

const router = new Router({
  matcher: new TriePatternMatching({ trailingSlash: false }),
});

// Query params are optional by default, use ! to mark as required
router.addRoute({ id: "/search?q=:query!&page=:page<number>&sort=:sort" });

// Encode — optional params are omitted when not provided
const url = router.buildUrl("/search?q=:query!&page=:page<number>&sort=:sort", {
  query: "hello",
  page: 2,
});
console.log(url); // "/search?q=hello&page=2"

// Decode — typed params are automatically converted
const params = router.matchUrl("/search?q=hello&page=2");
console.log(params); // { id: "...", params: { query: "hello", page: 2 } }

// Query params not declared in the pattern (e.g. gclid, utm_*) are kept
// verbatim on the state and re-emitted by stateToUrl, so landing URLs
// survive navigation restoration untouched
const state = router.matchUrl("/search?q=hello&gclid=abc");
console.log(state); // { id: "...", params: { query: "hello" }, unknownQuery: "gclid=abc" }
console.log(router.stateToUrl(state)); // "/search?q=hello&gclid=abc"

// Undeclared params attach only to states created from a URL — hand-built
// states produce clean URLs, so they don't leak into in-app links. To carry
// them across a navigation explicitly:
await navigation.navigate({
  id: "/search?q=:query!&page=:page<number>&sort=:sort",
  params: { query: "next" },
  unknownQuery: navigation.state?.unknownQuery,
});
```

### Browser Integration

```ts
import { Navigation, Router, TriePatternMatching } from "@wroud/navigation";
import { BrowserNavigation } from "@wroud/navigation/browser";

// Create a router with pattern matching
const router = new Router({
  matcher: new TriePatternMatching({
    trailingSlash: true,
    base: "/app", // Base path for the application
  }),
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
  params: { id: "123" },
});

// Browser URL is now /app/products/123

// Later, remove the listener
unsubscribe();

// Tear down the bridge (e.g. on HMR dispose)
browserNavigation.dispose();
```

The bridge keeps `navigation.entries` aligned with the browser's session history:

- The browser's Back/Forward buttons move the cursor (`goBack`/`goForward` events), they never append entries.
- The URL is committed before your listeners run, so a listener that renders sees the new address bar.
- Scrolling happens at `finished`, once every listener has settled (see [Applied and finished](#applied-and-finished)),
  and only for the bridge's latest transition: a navigation the user left before it finished never scrolls, and its
  scroll position is not recorded. `navigate()` scrolls to the top, or to the fragment when the target state carries a
  `hash` (with its leading `#`: `{ id: "/docs", params: {}, hash: "#section" }`). `replace()` keeps the scroll
  position, as `replaceState` does, and still scrolls to a fragment when the target has one. Back/Forward restore the
  position the entry was left at.
- Where the [Navigation API](https://developer.mozilla.org/en-US/docs/Web/API/Navigation_API) is available it is used
  for every navigation: same-origin link clicks and GET form submissions that match a route are handled in-app
  (disable with `new BrowserNavigation(navigation, { interceptLinks: false })`), and the browser performs
  scroll-to-top, fragment scroll, scroll restoration and focus reset after `finished`; the browser's
  `navigation.transition` and loading UI span exactly until then, for in-app and browser-initiated navigations alike.
  Without it, `pushState`/`popstate` are used and the bridge performs the same scroll handling itself: it switches
  `history.scrollRestoration` to `manual` the first time it creates or moves between its own entries and hands the
  previous mode back on `pagehide`, so a reload or a return from another document lets the browser restore the
  initial entry's scroll position natively (a page restored from the back/forward cache takes `manual` again).
- A click on a link to the current URL, or any other same-URL `replace` the user initiated, is handled in-app as a
  `replace` where the Navigation API is available; a same-URL replace issued by script (`location.assign()`,
  `history.replaceState()` from other code) is left to the browser.
- Route guards run before the address bar changes for in-app and link navigations. A browser Back/Forward into a
  refused route is reverted after the fact, since the platform does not let a page cancel those. Without the
  Navigation API, an entry the bridge did not create (pushed by other code) cannot be reverted; the state stays put
  and the address bar is left where the user put it.
- A guard that redirects during a browser Back/Forward rewrites the entry the browser landed on in place (see
  [Protected Routes](#protected-routes-with-navigation-guards)); the browser and `navigation.entries` keep the same
  length and order.
- `registerRoutes()` must run before the first `navigate()` and after any `setState()`: entries created earlier exist
  only in memory, so a `goBack()` onto one of them resolves to `false` in History-API mode instead of moving the
  browser, and `setState()` replaces every entry with a fresh key without telling the platform. When the current
  entry from `setState()` already describes the browser's URL (server-side hydration), `registerRoutes()` adopts the
  browser entry in place and listeners receive a `replace` event instead of a `navigate`.
- Other code that calls `history.pushState()`/`replaceState()` (modal or analytics libraries) is tolerated: with the
  Navigation API the new entry is adopted after it commits, without cancelling it or scrolling; without it the
  entry is picked up on the next Back/Forward, and forward entries it truncated become unreachable through
  `goForward()` (which then resolves `false`). A change the bridge cannot detect up front (an entry replaced in
  place with the same URL and state) is bounded by a 2 s safety timeout: `go()`, `goBack()`, `goForward()` and
  `traverseTo()` resolve `false` when the browser has not answered by then, and a `popstate` that arrives later is
  handled like a user traversal, so the state realigns with wherever the browser actually went.
- A URL that matches no route becomes an entry with `state: null`, so listeners receive `to === null` and can render a
  not-found view; the address bar is left as the user typed it.
- Parameter values are percent-encoded per path segment, so `{ id: "a/b" }` round-trips through the URL intact.

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
  },
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
  },
});

const navigation = new Navigation(router);

// Resolves to false (and nothing changes) when not authenticated
const allowed = await navigation.navigate({ id: "/dashboard", params: {} });
```

A guard may redirect by calling `navigate()` or `replace()` while it runs. The redirect takes the place of the
navigation being guarded — same type, same position, same entry key — and only its state is the redirect's:

```ts
router.addRoute({ id: "/login" });
router.addRoute({
  id: "/dashboard",
  canActivate: async () => {
    if (isAuthenticated()) return true;
    await navigation.replace({ id: "/login", params: {} });
    return false;
  },
});

// entries: [..., "/", "/login"] — one entry, not two
const moved = await navigation.navigate({ id: "/dashboard", params: {} });
console.log(moved); // false: the guarded call resolves false once the redirect settled
```

- `navigate("/dashboard")` from `/` yields `["/", "/login"]`, whether the guard used `navigate()` or `replace()`.
- A redirect during `goBack()`, `goForward()`, `go()`, `traverseTo()` or a browser Back/Forward keeps the
  traversal: the target entry is rewritten in place, listeners receive the traversal's `type` (`back`/`forward`)
  with the redirect's state as `to`, and the guarded call resolves `false`.
- `go()`, `goBack()`, `goForward()` and `traverseTo()` called during a guard supersede it instead: they run with
  their own placement and the guarded call resolves `false`. Redirects can chain; the latest one wins.
- Navigations are processed one at a time. A call made while another navigation is still running its guards takes
  its place as described above; a call made after that navigation passed its guards waits for it to apply and then
  runs from the position it left, so a `goBack()` issued during a pending `navigate()` steps back from the new entry.

### Custom platforms

`Navigation` is a complete in-memory router on its own. `BrowserNavigation` is one `INavigationPlatform`; a native
history stack or a server-side renderer installs its own with `setPlatform()`:

```ts
import type {
  INavigationPlatform,
  NavigationTransition,
} from "@wroud/navigation";

class NativePlatform implements INavigationPlatform {
  async commit(transition: NavigationTransition): Promise<boolean> {
    // Runs after guards passed and before navigation.entries changes.
    // transition.type names the list mutation: "navigate" truncates at
    // transition.index and pushes transition.to, "replace" rewrites the slot
    // (its key is reused), "back"/"forward" move the cursor to transition.index.
    const applied = await nativeStack.apply(transition);
    if (!applied) return false; // veto: nothing is placed, nobody is notified

    // Resolves true once every listener settled, false when the transition did
    // not land after all (vetoed, thrown, or overtaken while committing); never rejects
    transition.finished.then((landed) => nativeStack.endTransition(landed));
    return true;
  }
}

navigation.setPlatform(new NativePlatform());
```

Return `true` when the platform is on the entry described by `to`/`index`; the base then places the entry, moves the
cursor and invokes the listeners. Return `false` to report "not applied": the navigation resolves `false` and nothing
changes. A thrown error propagates to the caller. `transition.finished` resolves `true` after the entry was placed
and every listener settled, and `false` otherwise — including a transition that returned `true` from `commit()` but
was overtaken by another one during the commit phase, so a platform that animates on `commit()` must end its
transition on that value rather than assume it landed. Listeners may take as long as a render, so `finished` can
resolve after the caller's promise did and after a later transition was committed: a platform that scrolls or
animates on `finished` must ignore a transition that is no longer its latest. Entry keys are opaque ids minted by
`Navigation`; platforms store them and never rewrite them. Call `setState()` before `setPlatform()` for the same
reason it precedes `registerRoutes()`.

## Changelog

All notable changes to this project will be documented in the [CHANGELOG](./CHANGELOG.md) file.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
