export function cleanViteResolveUrl(url: string): string {
  if (url.startsWith("\0")) {
    url = url.slice(1);
  }
  return url.replace("ssg-url:", "");
}

export function isViteResolveUrl(url: string): boolean {
  return url.includes("ssg-url:");
}
