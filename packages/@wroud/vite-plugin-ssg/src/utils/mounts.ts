import { joinBase, stripBase } from "./routes.js";

export interface MountLike {
  path: string;
}

export interface Mount<T extends MountLike> {
  path: string;
  base: string;
  source: T;
}

export interface MountTable<T extends MountLike, L> {
  mounts: readonly Mount<T>[];
  match(pathname: string): Mount<T> | undefined;
  find(path: string): Mount<T> | undefined;
  load(mount: Mount<T>): Promise<L>;
}

export function normalizeMountPath(path: string): string {
  const trimmed = path.trim().replace(/^\/+|\/+$/g, "");
  if (
    trimmed &&
    trimmed.split("/").some((segment) => segment === "" || segment === "..")
  ) {
    throw new Error(
      `[vite-plugin-ssg] invalid mount path "${path}": empty or ".." path segments are not allowed`,
    );
  }
  return trimmed;
}

export function mountBase(base: string, path: string): string {
  return joinBase(base, path + "/");
}

export function basePathname(base: string): string {
  return new URL(base, "http://ssg.local/").pathname;
}

export function selectMount<T extends MountLike>(
  mounts: readonly T[],
  pathname: string,
  basePath: string,
): T | undefined {
  const route = stripBase(pathname, basePath);
  let best: T | undefined;
  for (const mount of mounts) {
    const prefix = "/" + mount.path;
    const matches = mount.path
      ? route === prefix || route.startsWith(prefix + "/")
      : true;
    if (matches && (!best || mount.path.length > best.path.length)) {
      best = mount;
    }
  }
  return best;
}

export function mountRoute(path: string, route: string): string {
  return path ? joinBase("/" + path, route) : route;
}

export function createMountTable<T extends MountLike, L>(
  sources: readonly T[],
  siteBase: string,
  load: (source: T) => Promise<L>,
): MountTable<T, L> {
  const basePath = basePathname(siteBase);
  const mounts = sources.map((source) => ({
    path: source.path,
    base: mountBase(siteBase, source.path),
    source,
  }));
  const loaded = new Map<Mount<T>, Promise<L>>();
  return {
    mounts,
    match: (pathname) => selectMount(mounts, pathname, basePath),
    find: (path) => mounts.find((mount) => mount.path === path),
    load(mount) {
      let promise = loaded.get(mount);
      if (!promise) {
        promise = load(mount.source);
        loaded.set(mount, promise);
      }
      return promise;
    },
  };
}
