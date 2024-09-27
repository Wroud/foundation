export function createService<T>(name: string): new () => T {
  const obj = {
    [name]() {
      throw new Error(`Service type ${name} can't be initiated`);
    },
  };
  return obj[name] as unknown as new () => T;
}
