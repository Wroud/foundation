export type IAbstractServiceConstructor<
  T,
  TArgs extends unknown[] = unknown[],
> = abstract new (...args: TArgs) => T;
