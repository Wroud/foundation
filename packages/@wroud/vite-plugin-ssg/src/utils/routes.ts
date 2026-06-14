export function normalizeRoute(route: string): string {
  if (!route.startsWith("/")) {
    route = "/" + route;
  }
  return route;
}

export function sanitizeRoute(route: string): string {
  const queryIndex = route.search(/[?#]/);
  const path = queryIndex === -1 ? route : route.slice(0, queryIndex);
  if (path.split("/").includes("..")) {
    throw new Error(
      `[vite-plugin-ssg] invalid route "${route}": ".." path segments are not allowed`,
    );
  }
  return path;
}

export function stripBase(route: string, base: string): string {
  if (route === base) {
    return "/";
  }
  const baseWithSlash = base.endsWith("/") ? base : base + "/";
  return route.startsWith(baseWithSlash)
    ? route.slice(baseWithSlash.length - 1)
    : route;
}

export function joinBase(base: string, route: string): string {
  const b = base.endsWith("/") ? base.slice(0, -1) : base;
  const r = route.startsWith("/") ? route : "/" + route;
  return b + r || "/";
}

export function htmlFilePath(route: string): string {
  return route.endsWith("/") ? route + "index.html" : route + ".html";
}

export function rscFilePath(route: string): string {
  return route.endsWith("/") ? route + "index.rsc" : route + ".rsc";
}

export function routeFromRscPath(pathname: string): string {
  if (pathname.endsWith("/index.rsc")) {
    return pathname.slice(0, -"index.rsc".length);
  }
  return pathname.slice(0, -".rsc".length);
}
