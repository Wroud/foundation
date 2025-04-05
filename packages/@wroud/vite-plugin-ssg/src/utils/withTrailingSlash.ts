export function withTrailingSlash(path: string): string {
  if (path[path.length - 1] !== "/") {
    return `${path}/`;
  }
  return path;
}
