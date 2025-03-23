export type IReactiveValueSubscribe<TArgs extends any[]> = (
  onValueChange: () => void,
  ...args: TArgs
) => () => void;

export interface IReactiveValue<T, TArgs extends any[]> {
  get(...args: TArgs): T;
  subscribe: IReactiveValueSubscribe<TArgs>;
}
