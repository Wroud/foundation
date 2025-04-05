export function cleanSsgAssetId(url: string): string {
  if (url.startsWith("\0")) {
    url = url.slice(1);
  }
  return url.replace("ssg-asset-uri:", "");
}

export function isSsgAssetId(url: string): boolean {
  return url.includes("ssg-asset-uri:");
}

export function createSsgAssetId(url: string): string {
  return `\0ssg-asset-uri:${url}`;
}
