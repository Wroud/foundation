export function cleanViteResolveUrl(url: string): string {
  if (url.startsWith("\0")) {
    url = url.slice(1);
  }
  return url.replace("ssg-uri:", "");
}

export function isSSGResolveURI(url: string): boolean {
  return url.includes("ssg-uri:");
}

export function createSSGResolveURI(url: string): string {
  return `\0ssg-uri:${url}`;
}
