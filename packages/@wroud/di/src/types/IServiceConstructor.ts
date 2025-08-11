export type IServiceConstructor<T, TArgs extends unknown[] = unknown[]> = new (
  ...args: TArgs
) => T;
