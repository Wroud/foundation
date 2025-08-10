export function createService<T>(name: string): new () => T {
  return { name } as unknown as new () => T;
}
