export type IMiddlewareUnsubscribe = (() => void) | (() => Promise<void>);

export interface IMiddlewareSubscribe {
  (
    key: string,
    subscribeFn: () => IMiddlewareUnsubscribe | Promise<IMiddlewareUnsubscribe>,
    dependencies?: any[],
  ): Promise<void>;
}
