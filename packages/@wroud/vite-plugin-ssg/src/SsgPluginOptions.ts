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
}
