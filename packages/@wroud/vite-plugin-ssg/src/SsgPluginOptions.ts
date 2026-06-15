export type CspAlgorithm = "sha256" | "sha384" | "sha512";

export interface SsgCspOptions {
  /**
   * Hash algorithm used for the inline-script source expressions.
   * @default "sha256"
   */
  algorithm?: CspAlgorithm;
  /**
   * Inject a `<meta http-equiv="Content-Security-Policy">` tag at the start of
   * each page's `<head>`, so the policy ships inside the static HTML and needs
   * no server header. Disable to deliver the policy yourself via headers (see
   * `manifest`).
   * @default true
   */
  meta?: boolean;
  /**
   * Also write a JSON manifest mapping every pre-rendered route to its policy
   * and hashes, for hosts that deliver CSP through response headers. Pass a
   * string to choose the filename (relative to the build output dir).
   * @default false
   */
  manifest?: boolean | string;
  /**
   * Base directives the per-page policy is built from, as directive name →
   * source list. The computed inline-script hashes are appended to
   * `script-src` (created as `'self'` when absent). `'strict-dynamic'` must
   * not be used here: it voids `'self'`, which is what covers
   * `@vitejs/plugin-rsc`'s un-hashable `modulepreload`/stylesheet links.
   * @default { "script-src": ["'self'"] }
   */
  directives?: Record<string, readonly string[]>;
}

export interface SsgPluginOptions {
  /**
   * Milliseconds before a page render is aborted during the SSG build, so a
   * suspended-forever component cannot hang it. Dev renders are not bounded
   * by this: they follow the request's abort signal (client disconnect).
   * @default 10000
   */
  renderTimeout?: number;
  /**
   * Path to the app entry file, relative to the Vite `root` (or absolute).
   * When omitted, a single `*.entry.{tsx,ts,jsx,js}` file is auto-discovered
   * under `root`. The entry is client code: it runs during SSR and in the
   * browser, never in the react-server environment. Optional when an rsc
   * entry exists.
   */
  entry?: string;
  /**
   * Path to the react-server entry, relative to the Vite `root` (or
   * absolute). When omitted, a single `*.entry.rsc.{tsx,ts,jsx,js}` file is
   * auto-discovered under `root`. Exports a server component (optionally via
   * `createRscConfig`) receiving `{ context, app, children }`, where
   * `children` is the rendered client entry. Optional when an app entry
   * exists.
   */
  rscEntry?: string;
  /**
   * Inject `@vitejs/plugin-react` automatically. Set to `false` when you add a
   * React plugin (e.g. `@vitejs/plugin-react-swc`) yourself.
   * @default true
   */
  react?: boolean;
  /**
   * Pre-render routes to static `*.html` / `*.rsc` files at build time. Set
   * to `false` for a pure-SSR deployment that renders every page on demand
   * through the request handler (the rsc entry's default export): the build
   * then emits only the client, ssr, and rsc bundles and writes no HTML or
   * flight files. `onRoutesPrerender` is not called.
   * @default true
   */
  prerender?: boolean;
  /**
   * Emit a hash-based Content-Security-Policy for the static build output. For
   * every pre-rendered page the plugin computes a hash of each inline
   * `<script>` (the hydration bootstrap, the RSC flight payload chunks, and
   * your inline `Script` components) and assembles a `script-src 'self'
   * 'sha256-…'` policy that allows exactly those scripts — the static-host
   * answer when a per-request nonce is impossible. `true` uses the defaults
   * (`sha256`, inject a `<meta>` per page, no manifest); pass an object to
   * customize. Mutually exclusive with Vite's `html.cspNonce`. Applies to the
   * pre-rendered output only; it is not active for dev or `prerender: false`.
   * @default false
   */
  csp?: boolean | SsgCspOptions;
}
