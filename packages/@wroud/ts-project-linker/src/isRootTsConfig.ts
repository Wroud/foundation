export function isRootTsConfig(path: string): boolean {
  return path.endsWith("tsconfig.json");
}
