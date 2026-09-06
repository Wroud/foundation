<!-- header -->
# Changelog

All notable changes to this project will be documented in this file.

<!-- version:2.0.0 -->
## 2.0.0 (2026-09-06)

[Compare changes](https://github.com/Wroud/foundation/compare/nav-v1.6.0...nav-v2.0.0)

<!-- changelog -->
### ⚠️  Breaking Changes

- resolve navigation calls at apply, add pluggable browser platform for native scroll/history sync ([74090d1](https://github.com/Wroud/foundation/commit/74090d1))
  - navigate()/replace()/goBack()/goForward()/go()/traverseTo() now resolve as soon as the entry is applied and listeners have been invoked, instead of waiting for every listener's side effects to finish. This removes the lag between a click and the UI updating when a listener does async work (e.g. data fetching), since callers no longer block on it.
    <br>
    <br>Each transition now carries its own settlement signal (all listeners settled, never rejects) that the browser integration uses internally to know when it's safe to scroll or restore focus. This fixes anchor-link navigation (`/#pricing`-style) almost never scrolling to the target, which happened because scrolling used to run as soon as a render was scheduled rather than after it actually committed.
    <br>
    <br>Browser history/scroll syncing is now driven by a pluggable INavigationPlatform, with two implementations: one using the History API (any browser) and one using the native Navigation API where available.
    <br>Behavior improvements from this rework:
    <br>  - replace() now preserves scroll position instead of jumping to top
    <br>  - a push to the same URL still scrolls to a new hash target
    <br>  - the entry the page was hydrated with no longer re-applies its fragment and re-scrolls on mount
    <br>  - back/forward navigation intercepted via the Navigation API now waits for the new content to settle before the browser restores scroll
    <br>
    <br>Navigation now exposes a full entry/history model aligned with the
    <br>Navigation API: `entries`, `currentEntry`, `canGoBack`, `canGoForward`, and `setPlatform()` for wiring in a platform.
  - navigate(), replace(), goBack(), goForward(), go(), and traverseTo() now return `Promise<boolean>` (whether the navigation was  applied) instead of `Promise<void>`. Existing `await`s keep working, but code that needs to know when listener side effects have finished must move that logic into a listener rather than awaiting the navigate() call - the promise now settles earlier.
  - `INavigationState` has been removed; use the new `INavigationEntry` (exported from the package root) for entry-shaped data. `state`, `history`, and `position` on `INavigation` are now readonly.

<!-- version:1.6.0 -->
## 1.6.0 (2026-07-04)

[Compare changes](https://github.com/Wroud/foundation/compare/nav-v1.5.0...nav-v1.6.0)

<!-- changelog -->
### ✨ Features

- preserve undeclared query params and stop URL rewrite on navigation restore ([4085745](https://github.com/Wroud/foundation/commit/4085745))

<!-- version:1.5.0 -->
## 1.5.0 (2026-06-23)

[Compare changes](https://github.com/Wroud/foundation/compare/nav-v1.4.0...nav-v1.5.0)

<!-- changelog -->
### ✨ Features

- support for Navigation API for scroll handling and more native behavior ([c476b66](https://github.com/Wroud/foundation/commit/c476b66))

<!-- version:1.4.0 -->
## 1.4.0 (2026-06-16)

[Compare changes](https://github.com/Wroud/foundation/compare/nav-v1.3.0...nav-v1.4.0)

<!-- changelog -->
### ✨ Features

- make notifyListeners asynchronous to handle promises in navigation events ([d09bf42](https://github.com/Wroud/foundation/commit/d09bf42))

<!-- version:1.3.0 -->
## 1.3.0 (2026-06-08)

[Compare changes](https://github.com/Wroud/foundation/compare/nav-v1.2.0...nav-v1.3.0)

<!-- changelog -->
### ✨ Features

- enhance navigation state management with hash support and update path utilities ([f9b4849](https://github.com/Wroud/foundation/commit/f9b4849))

<!-- version:1.2.0 -->
## 1.2.0 (2026-05-18)

[Compare changes](https://github.com/Wroud/foundation/compare/nav-v1.1.1...nav-v1.2.0)

<!-- changelog -->
### ✨ Features

- add IPatternNavigation interface and corresponding tests for TriePatternMatching ([61feb4e](https://github.com/Wroud/foundation/commit/61feb4e))

<!-- version:1.1.1 -->
## 1.1.1 (2026-04-16)

[Compare changes](https://github.com/Wroud/foundation/compare/nav-v1.1.0...nav-v1.1.1)

<!-- changelog -->
### 🩹 Fixes

- browser navigation state sync ([a9cf9c6](https://github.com/Wroud/foundation/commit/a9cf9c6))

<!-- version:1.1.0 -->
## 1.1.0 (2026-04-16)

[Compare changes](https://github.com/Wroud/foundation/compare/nav-v1.0.1...nav-v1.1.0)

<!-- changelog -->
### ✨ Features

- add support for query parameters ([bc37301](https://github.com/Wroud/foundation/commit/bc37301))

<!-- version:1.0.1 -->
## 1.0.1 (2025-09-22)

[Compare changes](https://github.com/Wroud/foundation/compare/nav-v1.0.0...nav-v1.0.1)

<!-- changelog -->
### 🩹 Fixes

- publish sources to npm for source maps ([0631b68](https://github.com/Wroud/foundation/commit/0631b68))

<!-- version:1.0.0 -->
## 1.0.0 (2025-08-03)

[Compare changes](https://github.com/Wroud/foundation/compare/nav-v0.2.0...nav-v1.0.0)

<!-- changelog -->
### ⚠️  Breaking Changes

- enhance parameter validation for date and JSON types; add tests for new functionality ([5cf229e](https://github.com/Wroud/foundation/commit/5cf229e))
  - BREAKING CHANGE: empty string now is valid value for required param, undefined is not valid wildcard item anymore.

<!-- version:0.2.0 -->
## 0.2.0 (2025-05-21)

[Compare changes](https://github.com/Wroud/foundation/compare/nav-v0.1.2...nav-v0.2.0)

<!-- changelog -->
### ✨ Features

- parse typed route params ([#36](https://github.com/Wroud/foundation/issues/36)) ([0c41d5f](https://github.com/Wroud/foundation/commit/0c41d5f))

<!-- version:0.1.2 -->
## 0.1.2 (2025-05-17)

[Compare changes](https://github.com/Wroud/foundation/compare/nav-v0.1.1...nav-v0.1.2)

<!-- changelog -->
### 🩹 Fixes

- support numeric and boolean params ([#20](https://github.com/Wroud/foundation/issues/20)) ([174a6d0](https://github.com/Wroud/foundation/commit/174a6d0))

<!-- version:0.1.1 -->
## 0.1.1 (2025-04-05)

[Compare changes](https://github.com/Wroud/foundation/compare/nav-v0.1.0...nav-v0.1.1)

<!-- changelog -->
### 🩹 Fixes

- duplicated slash; improved types ([2a793f2](https://github.com/Wroud/foundation/commit/2a793f2))

<!-- version:0.1.0 -->
## 0.1.0 (2025-03-23)

<!-- changelog -->
### ✨ Features

- navigation with pattern matching ([dc5b0d7](https://github.com/Wroud/foundation/commit/dc5b0d7))

