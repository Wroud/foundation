export function isVirtualStoriesModule(source: string) {
  return source.endsWith("?stories");
}
export function createVirtualStoriesModule(source: string) {
  return source + "?stories";
}
