# @wroud/vite-plugin-ssg

[![ESM-only package][package]][package-url]
[![NPM version][npm]][npm-url]

[package]: https://img.shields.io/badge/package-ESM--only-ffe536.svg
[package-url]: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c
[npm]: https://img.shields.io/npm/v/@wroud/vite-plugin-ssg.svg
[npm-url]: https://npmjs.com/package/@wroud/vite-plugin-ssg

`@wroud/vite-plugin-ssg` is a Vite plugin that renders React applications to static HTML at build time. It is built on top of [`@vitejs/plugin-rsc`](https://www.npmjs.com/package/@vitejs/plugin-rsc). Your app entry is ordinary client-flavored React — hooks, contexts, DI containers and routers work directly — rendered to HTML during the build and hydrated in the browser. React Server Components are an opt-in extension via a separate rsc entry.

## Features

- **Static Site Generation (SSG)**: Renders each route to a static `.html` file at build time.
- **Client-first entry**: Your entry is plain React client code; no `"use client"` ceremony required for the app itself.
- **Opt-in React Server Components**: Add an `*.entry.rsc.tsx` to fetch data and render server components around your app, powered by `@vitejs/plugin-rsc`.
- **You own routing**: A single root component decides what to render per URL; `onRoutesPrerender` lists the routes to emit. The plugin does no routing.
- **Opt-in client navigation**: Each route also emits an RSC flight payload (`*.rsc`). Links do full-page loads by default (no global click/history hijacking — safe alongside any router); call `navigate()` for streaming client-side transitions when you want them.
- **Server actions at request time**: `"use server"` functions run through the rsc handler in dev and in a `prerender: false` runtime — both post-hydration calls and no-JS `<form action>` progressive enhancement, with no app wiring.
- **HMR / React Refresh**: Fast development through Vite + `@vitejs/plugin-react`.

## Requirements

- **React** 19 or higher
- **Vite** 8 or higher

`ssgPlugin()` injects `@vitejs/plugin-rsc` and `@vitejs/plugin-react` for you — you only add `ssgPlugin()` to your `plugins`. If you already use a React plugin (for example `@vitejs/plugin-react-swc`), pass `ssgPlugin({ react: false })`.

## Installation

```sh
npm install @wroud/vite-plugin-ssg
```

## Usage

### Options

```ts
interface SsgPluginOptions {
  /**
   * Milliseconds before a page render is aborted during the SSG build, so a
   * suspended-forever component cannot hang it. Dev renders follow the
   * request's abort signal instead. @default 10000
   */
  renderTimeout?: number;
  /**
   * Path to the app entry file (client code), relative to Vite `root`.
   * When omitted, a single `*.entry.{tsx,ts,jsx,js}` file is auto-discovered.
   */
  entry?: string;
  /**
   * Path to the optional react-server entry. When omitted, a single
   * `*.entry.rsc.{tsx,ts,jsx,js}` file is auto-discovered.
   */
  rscEntry?: string;
  /** Inject `@vitejs/plugin-react` automatically. @default true */
  react?: boolean;
}
```

### Example configuration

The root component is discovered by convention: name it `*.entry.{tsx,ts,jsx,js}` (for example `index.entry.tsx`) anywhere under your Vite `root`. No `rollupOptions.input` is needed.

```ts
import { defineConfig } from "vite";
import { ssgPlugin } from "@wroud/vite-plugin-ssg";

export default defineConfig({
  root: "src",
  build: { outDir: "../dist" },
  plugins: [ssgPlugin()],
});
```

If you have a non-standard layout or want to be explicit, pass `ssgPlugin({ entry: "index.entry.tsx" })`.

### App entry

Create `src/index.entry.tsx`. Its default export is a full-document component that renders based on the URL. The entry is **client code**: it runs during SSR and in the browser (never in the react-server environment), so hooks, React context, DI containers and routers work exactly as in a plain React app — no `"use client"` directives needed.

```tsx
import type { IndexComponentProps } from "@wroud/vite-plugin-ssg";
import { Html, Head, Body } from "@wroud/vite-plugin-ssg/react/components";
import { Counter } from "./Counter.js";
import "./index.css";

export default function Index({ context }: IndexComponentProps) {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <title>Home</title>
      </Head>
      <Body>
        <h1>Home</h1>
        <Counter />
      </Body>
    </Html>
  );
}
```

`context` carries `{ href, base, cspNonce }` for the page being rendered; request `headers` are available only to the ssr `onAppStart` context (dev requests) and to the rsc entry's `context`, never to the component. Assets are injected automatically (there is **no** `renderTags`/`mainScriptUrl` — the bootstrap script and CSS are added for you).

### React Server Components (optional)

To run logic in the react-server phase — async data loading at build time, server components — add `src/index.entry.rsc.tsx`. Use `createRscConfig` (the rsc twin of `createAppConfig`): it accepts a server component plus an optional lifecycle. The component receives `children` — the rendered client entry — and wraps, replaces, or surrounds it:

```tsx
import type { RscEntryProps } from "@wroud/vite-plugin-ssg";
import { createRscConfig } from "@wroud/vite-plugin-ssg/app";
import { PostsProvider } from "./posts-provider.js";

async function RscRoot({ context, app, children }: RscEntryProps<MyRscApp>) {
  const posts = await loadPosts(app.db);
  return <PostsProvider posts={posts}>{children}</PostsProvider>;
}

export default createRscConfig(RscRoot, {
  onAppStart: () => ({ base: "/", db: openDb() }),
  onRoutesPrerender: (app) => listPages(app.db),
  onAppStop: (app) => app.db.close(),
});
```

- `children` — the client entry, already rendered with `context`; return it as-is to pass through.
- `app` — the result of the rsc `onAppStart`; it stays on the server and is **never** serialized into production output. (In dev, React's flight debug info echoes server-component props — treat dev payloads as non-confidential, as with any RSC framework.)
- A bare component default export (without `createRscConfig`) works too.

To hand server data to the client app, wrap `children` in your own `"use client"` provider (like `PostsProvider` above): its props are flight-serialized, and your entry reads them via context anywhere in its tree. Providers render no DOM, so wrapping outside `<Html>` is valid.

```tsx
// posts-provider.tsx
"use client";
import { createContext, useContext } from "react";

const PostsContext = createContext<Post[]>([]);
export const usePosts = () => useContext(PostsContext);
export function PostsProvider({ posts, children }) {
  return <PostsContext.Provider value={posts}>{children}</PostsContext.Provider>;
}
```

The rsc `onAppStart` runs **once per build/dev process** and `onAppStop` is invoked after the build finishes — the server lifecycle. When the rsc entry declares `onRoutesPrerender`, it takes precedence over the app entry's.

Three usage modes:

| Mode | Files | What runs where |
| --- | --- | --- |
| Client-native | `*.entry.tsx` | your app is plain client React, SSR'd + hydrated; the plugin supplies the rsc plumbing |
| RSC-native | `*.entry.rsc.tsx` | pure server components, no client entry needed; routes via the rsc `onRoutesPrerender` |
| Combined | both | server components compose around the client app via `children` |

Components in the rsc entry's graph are server components (they may be `async`, run only at build time, and cannot use hooks or context); your app entry and everything it imports stay client components.

### Routes and app lifecycle

Use `createAppConfig` to run startup logic and declare which routes to pre-render. Each route in `onRoutesPrerender` becomes one `.html` file, rendered by your root component with `context.href` set to that route — your root decides what to show. Plain `<a href="/about">` links navigate between them.

```tsx
import { createAppConfig } from "@wroud/vite-plugin-ssg/app";

function Index({ context }: IndexComponentProps) {
  const { pathname } = new URL(context.href ?? "/", "http://localhost/");
  if (pathname === "/about") return <AboutPage />;
  return <HomePage />;
}

export default createAppConfig(Index, {
  onAppStart: async (context) => ({ base: context.base ?? "/" }),
  onRoutesPrerender: () => ["/", "/about"],
});
```

Without `onRoutesPrerender`, only `/` is pre-rendered.

`onAppStart` runs in both client-flavored environments: during SSR of each page, and in the browser once before hydration (awaited before `hydrateRoot`, so async initialization is safe). It can create non-serializable infrastructure — a DI container, a router — and its returned data is provided to the whole tree via `useAppContext()`, surviving `navigate()` transitions:

```ts
export default createAppConfig(Index, {
  onAppStart: async (context) => ({
    base: context.base ?? "/",
    container: buildDiContainer(),
    router: await createRouter(context.base ?? "/"),
  }),
  onRoutesPrerender: (app) => ["/", "/about"],
  onAppStop: (app) => app.container.dispose(),
});
```

`onAppStop` pairs with each `onAppStart`: the build invokes it after a page finishes prerendering and after route discovery, so resources opened per start are released per start.

Lifecycle summary:

| Hook | File | Runs in | Purpose |
| --- | --- | --- | --- |
| `onAppStart` (`createAppConfig`) | `*.entry.tsx` | ssr (per page) + browser (once) | app state, DI, router for `useAppContext()` |
| `onRoutesPrerender` (`createAppConfig`) | `*.entry.tsx` | ssr (build) | routes to emit |
| `onAppStop` (`createAppConfig`) | `*.entry.tsx` | ssr | release resources, paired with each start |
| `onAppStart` (`createRscConfig`) | `*.entry.rsc.tsx` | rsc (once per process) | server-only data for the rsc root (`app` prop) |
| `onRoutesPrerender` (`createRscConfig`) | `*.entry.rsc.tsx` | rsc (build) | routes to emit (takes precedence) |
| `onAppStop` (`createRscConfig`) | `*.entry.rsc.tsx` | rsc (end of build) | release server resources |

### Client navigation (optional)

By default, links are plain full-page loads — the plugin installs **no** global click or history handlers, so it never conflicts with your own router. To opt into streaming flight transitions, use the `navigate` function the plugin hands your app.

`navigate(href)` only fetches that route's RSC payload and swaps the rendered tree in place — it does **not** touch the URL or history. You (or your router) own history; call `navigate()` to update the content.

`navigate` is delivered through `context.navigate` — the same `context` your `onAppStart` receives. It exists only in the browser (it is `undefined` during SSR, where there is nothing to navigate), so capture it in your app data and let any component reach it via `useAppContext()`:

```tsx
import { createAppConfig } from "@wroud/vite-plugin-ssg/app";
import { useAppContext } from "@wroud/vite-plugin-ssg/react/components";

export default createAppConfig(Index, {
  onAppStart: (context) => ({
    base: context.base ?? "/",
    navigate: context.navigate,
  }),
  onRoutesPrerender: () => ["/", "/about"],
});

function Link({ href, children }: { href: string; children: React.ReactNode }) {
  const { navigate } = useAppContext<{
    navigate?: (href: string) => Promise<void>;
  }>();
  return (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault();
        history.pushState(null, "", href);
        navigate?.(href);
      }}
    >
      {children}
    </a>
  );
}
```

For browser back/forward, wire `popstate` yourself with the same `navigate`: `window.addEventListener("popstate", () => navigate(location.href))`.

### Server actions (optional)

`"use server"` functions are dispatched by the rsc entry's default-export handler **at request time** — in dev and in a `prerender: false` runtime (your own server, edge, or lambda). No app wiring is needed; the browser entry registers the server-action callback and the handler routes both paths:

- **Post-hydration calls** — calling a server function from a client component (a click handler, `useActionState`, …) POSTs the encoded arguments to the route's flight endpoint. The handler runs the function and streams a fresh RSC payload back, so the return value and any re-render arrive in a single round trip.
- **Progressive enhancement** — `<form action={fn}>` works without JavaScript: the no-JS POST is decoded, the action runs, and the handler responds with freshly rendered HTML (`useActionState` form state is hydrated on the client).

The static SSG build has no server, so actions cannot run during prerender. Render any route that depends on them through the runtime handler (`prerender: false`).

### Generated output

For `outDir: "dist"` and routes `/`, `/about`:

- `dist/index.html`, `dist/about.html` — the static HTML pages (served site).
- `dist/index.rsc`, `dist/about.rsc` — the RSC flight payload for each route (client navigation).
- `dist/assets/*` — client JS/CSS bundles.
- `dist-rsc/`, `dist-ssr/` — intermediate RSC and SSR builds (not served).

## CSP

Set Vite's [`html.cspNonce`](https://vite.dev/config/shared-options.html#html-cspnonce) and the plugin applies it everywhere a nonce is needed, in dev and in build output:

- the hydration bootstrap `<script>` and the inline RSC flight payload `<script>`s;
- a `<meta property="csp-nonce" nonce="…">` tag in `<head>`, which Vite's preload helper and dev client read at runtime;
- `context.cspNonce` for your components, and the `Link`/`Script` components: `Link` sets `nonce` on every `<link>`; `Script` sets it only when it renders inline content (children or `dangerouslySetInnerHTML`) or when you pass `forceNonce` — an explicitly passed `nonce` prop always wins. The nonce also rides the flight payload, so server, hydration and `navigate()` renders agree on it.

Vite documents `html.cspNonce` as a per-request **placeholder** that your host substitutes into responses — the plugin emits it verbatim.

The policy for nonce mode (dev, or production behind edge compute):

```
script-src 'self' 'nonce-<value>'; style-src 'self'
```

- In dev, add `'unsafe-eval'` to `script-src` (`@vitejs/plugin-rsc`'s `findSourceMapURL` evaluates source maps) and `'unsafe-inline'` to `style-src` (injected dev styles). With a header-delivered CSP, browsers hide the `nonce` content attribute, so React's dev hydration diff logs an attribute-mismatch warning for inline `Script` elements — a known cosmetic warning; hoisted `Link`/meta tags are unaffected.
- `'strict-dynamic'` is optional: it makes browsers ignore `<link rel="modulepreload">` and voids `'self'` — a performance cost, not a security hole.
- The stylesheet and modulepreload `<link>`s injected by `@vitejs/plugin-rsc` cannot carry a nonce (react-dom's `preinit`/`preloadModule` strip it and dedupe by URL — an upstream limitation); they are covered by `'self'`.

Choosing a CSP strategy for the static output:

- **Dynamic SSR server** (`prerender: false`, rendering every request through the rsc entry's default-export handler): generate a fresh nonce per request and pass it as the handler's second argument — `handler(request, { cspNonce })`. It overrides the build-time `html.cspNonce` for that render and flows everywhere the baked value would (bootstrap and flight `<script>`s, the `csp-nonce` meta, and `context.cspNonce` for `Link`/`Script`). Emit the matching `script-src 'self' 'nonce-<value>'` header on the same response and never cache it.
- **Edge compute in front of static files** (Cloudflare Workers, edge middleware, …): set `html.cspNonce` to a placeholder and substitute a fresh value per request in **both** the `.html` file and the matching `*.rsc` file — the nonce is embedded in the flight JSON too. Never cache substituted responses.
- **Static headers or no header control**: a per-request nonce is impossible (it would be identical for every visitor, which defeats it). Use a hash-based CSP instead — set the plugin's `csp` option (see below).

### Hash-based CSP for the static build

For a purely static deployment (GitHub Pages, S3, any host without per-request compute) where a nonce makes no sense, enable hash mode:

```ts
ssgPlugin({ csp: true });
```

For each pre-rendered page the plugin computes a hash of every inline `<script>` it emits — the hydration bootstrap, the RSC flight payload chunks, and your inline `Script` components — and assembles a policy that allows exactly those scripts:

```
script-src 'self' 'sha256-…' 'sha256-…' …
```

The hashes are page-specific (each page lists its own scripts) and deterministic across builds. `csp` and Vite's `html.cspNonce` are mutually exclusive — setting both throws.

Hash mode is a **build-time only** technique, and deliberately so: a hash must be known before the policy is sent, but the inline RSC flight payload is emitted at the *end* of the document with per-request content, so its hash isn't known until the whole page has rendered. Pre-rendering buffers the full page anyway (it writes a file), so hashing is free there — but a streaming request-time render cannot list a hash for a script it hasn't produced yet. This is the same split every framework makes: hashes for static/prerendered output (Astro's CSP, Next.js SRI), a **nonce** for dynamic streaming SSR (Next.js App Router). So `csp` is inert in dev and for `prerender: false`; for a dynamic SSR server use a per-request nonce instead (next bullet — the nonce already rides the bootstrap and flight `<script>`s).

By default the policy ships inside each page as a `<meta http-equiv="Content-Security-Policy">` injected at the start of `<head>`, so no server header is needed. Options:

```ts
ssgPlugin({
  csp: {
    algorithm: "sha256", // or "sha384" | "sha512"
    meta: true, // inject the <meta> tag (default)
    manifest: true, // also write csp-manifest.json mapping each route → policy + hashes
    directives: {
      // base directives the per-page policy is built from; the computed
      // hashes are appended to script-src (created as 'self' when absent)
      "default-src": ["'self'"],
      "img-src": ["'self'", "data:"],
    },
  },
});
```

- Deliver the policy via a header instead of (or alongside) the meta tag by setting `manifest: true` and reading `csp-manifest.json` (`{ version, algorithm, pages: [{ route, file, policy, hashes }] }`) in your host config; set `meta: false` to drop the in-page tag.
- The injected `<meta>` is enforced **in addition to** any `Content-Security-Policy` response header — a resource must satisfy *every* active policy. If your host already sends a CSP header that lacks these per-page hashes, it will block the very inline scripts the meta allows. In that case use `meta: false` and fold the manifest's hashes into that header instead of shipping two policies.
- Do **not** add `'strict-dynamic'`: it voids `'self'`, which is what covers `@vitejs/plugin-rsc`'s `modulepreload`/stylesheet `<link>`s — those cannot be hashed (react-dom strips their nonce/hash and dedupes by URL).
- The generated policy only constrains `script-src` unless you add more `directives`, so enabling it will not unexpectedly block images, styles, or fetches.
- A `<meta>`-delivered policy cannot carry `frame-ancestors`, `report-uri`, `report-to`, or `sandbox` — browsers ignore those directives when they arrive via meta. If you add them to `directives` while `meta` is on, the plugin warns at build time; deliver them through a response header instead (`meta: false` + the manifest policy).

## Notes

- **Relative `fetch()` during dev SSR**: in dev, root-relative fetches (`fetch("/api/...")`) made while rendering on the server are resolved against the current request origin, so they reach your Vite middlewares (including `server.proxy`) exactly like browser fetches. In production (SSG build) there is no server — use absolute URLs (e.g. from an environment variable) for any build-time fetching.
- **`.env` files are not loaded into `process.env` during prerender**: the SSG build imports your rsc/ssr bundles in the Vite build process, which never reads `.env` files into `process.env` — only shell-exported variables are visible to `process.env.X` reads in `onAppStart`, `onRoutesPrerender` and server components at build time. `import.meta.env.VITE_*` keys keep working (Vite bakes them at build). If your build-time code needs values from a `.env` file, export them in the shell (e.g. CI secrets) or load them yourself before `vite build` (`node --env-file=.env`, `dotenv -e .env -- vite build`).
- **`"use server"` actions run at request time only**: they are dispatched by the rsc handler in dev and in a `prerender: false` runtime (post-hydration calls and no-JS `<form action>` progressive enhancement — see [Server actions](#server-actions-optional)). The static build output is just HTML + flight payloads with no server, so actions cannot run during prerender.
- **React context across the server/client boundary**: components in the rsc entry's graph are server components and cannot read React context (including `useAppContext`). Pass data to them via props, and bridge data to the client app by wrapping `children` in a `"use client"` provider with serializable props.
- **TypeScript**: add `@vitejs/plugin-rsc/types` to your `tsconfig.json` `types` for `import.meta.viteRsc` typings.

## Documentation

For detailed usage and API reference, visit the [documentation site](https://wroud.dev).

## Changelog

All notable changes to this project will be documented in the [CHANGELOG](./CHANGELOG.md) file.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
