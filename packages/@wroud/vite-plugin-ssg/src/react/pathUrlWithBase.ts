export function pathUrlWithBase<T extends string | undefined>(
  base: string | undefined,
  url: T,
): T {
  if (url === undefined) {
    return url;
  }

  if (base !== undefined && url.startsWith("/")) {
    return (base + url.slice(1)) as T;
  }

  return url;
}
