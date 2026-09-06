# @wroud/navigation-react

React bridge for `@wroud/navigation`. Navigation is a React transition: the provider runs each navigation as an async action (the app's optional `load` step, then the route state update inside `startTransition`) and holds the platform's `finished` until a `RouteCommitted` marker for the target route has committed.

## API

```tsx
<NavigationProvider navigation={navigation} load={loadRoute} prefetch={warm}>
  <App />
</NavigationProvider>
```

- `NavigationProvider({ navigation, load?, prefetch?, children })`: `load(to, from, type)` is called when the target document is not already on screen, that is when no `RouteCommitted` marker with the target's token is mounted; on the hydrated first render the markers may not be mounted yet, so `load` is also called once for the initial entry with `from === null` and the app decides. `prefetch` is skipped for mounted tokens the same way.
- `useNavigation(): INavigation`
- `useNavigationState(): IRouteState | null` (transition-consistent)
- `useNavigationPending(): boolean` (the provider's transition, for a global indicator)
- `RouteCommitted({ state })`
- `useLink({ to, replace? })` returns `{ href, pending, onClick }`
- `Link` renders `<a>` on `useLink`, sets `data-status="pending"` while pending, and leaves clicks alone when `defaultPrevented`, a modifier key or non-primary button is involved, or `target` is set to anything but `_self`; `prefetch(to)` runs on `pointerenter` and `focus` only for links whose click would be intercepted
- `useNavigate(): [navigate, pending]`

## Marker placement

Render `RouteCommitted` as a sibling of the route content, inside the route's Suspense boundary and outside the error boundary, only where a route component is actually rendered. It then commits together with the content or the error fallback, never with a loading fallback. Never render it next to a loading placeholder, and never for a route that has no component. A route rendered without a marker leaves the navigation's `finished` unresolved.

The marker's token is the hash-less URL of `state`, so a hash-only navigation settles at once and several markers with one token are reference counted. A newer navigation settles the older waiter; a rejected `load` releases the gate and still applies the entry.

## Same-document links

`useLink`, `Link` and `useNavigate` mirror HTML fragment navigation. When the target's token (hash-less, `unknownQuery`-less URL) equals the current entry's, the navigation keeps the current entry's `unknownQuery`, and when the resulting URL, hash included, equals the current URL exactly it replaces instead of pushing.

## Transition types

When the installed React exports `addTransitionType`, every navigation is tagged `navigation-navigate`, `navigation-replace`, `navigation-back` or `navigation-forward`, ready for `<ViewTransition enter={...} exit={...}>` around the outlet. On a React without it nothing is tagged.

Design notes: `packages/docs/src/packages/navigation/plans/navigation-react.md`.

## Typed navigation

Register the app's navigation type once and `useNavigation()` returns it everywhere, without casts:

```ts
declare module "@wroud/navigation-react" {
  interface Register {
    navigation: Navigation<TriePatternMatching>;
  }
}
```
