export function pathUrlWithBase<T extends string | undefined>(
  base: string | undefined,
  url: T,
): T {
  if (url === undefined || url.startsWith("/")) {
    if (base?.startsWith("http")) {
      return new URL(url ?? "/", base).href as T;
    }
    return url;
  }

  if (url?.startsWith("http")) {
    if (base?.startsWith("http")) {
      return url;
    }

    if (new URL(url).origin !== new URL(import.meta.url).origin) {
      return url;
    }

    url = new URL(url).pathname.slice(1) as T;
  }

  if (base !== undefined) {
    return (base + url) as T;
  }

  return url;
}
