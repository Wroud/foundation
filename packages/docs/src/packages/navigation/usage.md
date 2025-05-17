---
outline: deep
---

# Usage

This section demonstrates how to configure routing and perform navigation.

## Basic Usage

```ts
import { Navigation, Router } from "@wroud/navigation";

const router = new Router();
router.addRoute({ id: "/" });
router.addRoute({ id: "/users/:id" });

const navigation = new Navigation(router);
await navigation.navigate({ id: "/users/:id", params: { id: "123" } });
```

## Browser Integration

```ts
import { Navigation, Router, TriePatternMatching } from "@wroud/navigation";
import { BrowserNavigation } from "@wroud/navigation/browser";

const router = new Router({
  matcher: new TriePatternMatching({ trailingSlash: true, base: "/app" }),
});
router.addRoute({ id: "/" });
router.addRoute({ id: "/products/:id" });

const navigation = new Navigation(router);
const browserNavigation = new BrowserNavigation(navigation);
await browserNavigation.registerRoutes();
```

## Navigation Guards

```ts
import { Navigation, Router } from "@wroud/navigation";

const router = new Router();
router.addRoute({ id: "/" });
router.addRoute({
  id: "/dashboard",
  canActivate: () => isAuthenticated(),
});
router.addRoute({
  id: "/editor/:documentId",
  canDeactivate: () => confirm("Discard unsaved changes?"),
});

const navigation = new Navigation(router);
```
