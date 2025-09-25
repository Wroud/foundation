export function createService<T>(
  name: string,
): T extends (...args: any) => any
  ? new (...args: Parameters<T>) => ReturnType<T>
  : T extends abstract new (...args: any) => any
    ? T
    : new () => T {
  return { name } as any;
}
