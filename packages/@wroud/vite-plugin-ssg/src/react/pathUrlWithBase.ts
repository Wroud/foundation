const OPAQUE_URL = /^(?:\/\/|(?!https?:)[a-z][a-z0-9+.-]*:)/i;

export function pathUrlWithBase<T extends string | undefined>(
  base: string,
  url: T,
): T {
  if (url === undefined || OPAQUE_URL.test(url)) {
    return url;
  }
  if (url.startsWith("/")) {
    if (base.startsWith("http")) {
      return new URL(url, base).href as T;
    }
    return url;
  }

  if (url.startsWith("http")) {
    if (base.startsWith("http")) {
      return url;
    }

    if (new URL(url).origin !== new URL(import.meta.url).origin) {
      return url;
    }

    url = new URL(url).pathname.slice(1) as T;
  }

  return (base + url) as T;
}
