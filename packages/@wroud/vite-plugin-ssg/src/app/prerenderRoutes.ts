import type { IndexComponentContext } from "../react/IndexComponent.js";
import { normalizeRoute } from "../utils/routes.js";

export interface PrerenderSource<T> {
  start(context: IndexComponentContext): Promise<T>;
  getRoutesPrerender(app: T): Promise<string[]>;
  stop(app: T): Promise<void> | void;
}

export async function collectPrerenderRoutes<T>(
  source: PrerenderSource<T>,
  base: string,
): Promise<string[]> {
  const context: IndexComponentContext = {
    href: new URL(base, "http://ssg.local/").href,
    base,
  };
  const app = await source.start(context);
  try {
    const declared = await source.getRoutesPrerender(app);
    const routes = [...new Set(declared.map(normalizeRoute))];
    return routes.length ? routes : ["/"];
  } finally {
    await source.stop(app);
  }
}
