import type { ILogger } from "@wroud/api-logger";
import type { IErrorMiddleware } from "./interfaces/IErrorMiddleware.js";
import type { IMiddleware } from "./interfaces/IMiddleware.js";
import type { IMiddlewareRequest } from "./interfaces/IMiddlewareRequest.js";
import type { IMiddlewareUnsubscribe } from "./interfaces/IMiddlewareSubscribe.js";

interface IMiddlewareState {
  active: boolean;
  dependencies?: any[];
  unsubscribe: IMiddlewareUnsubscribe;
}

type MiddlewareStates<Data> = Map<
  IMiddleware<Data> | IErrorMiddleware<Data>,
  Map<string, IMiddlewareState>
>;

type ExecutedMiddlewares<Data> = Set<
  IMiddleware<Data> | IErrorMiddleware<Data>
>;

export class MiddlewareRequest<Data = Record<string, any>>
  implements IMiddlewareRequest<Data>
{
  private middlewareStates: MiddlewareStates<Data>;
  private isDisposed: boolean;

  constructor(
    private readonly middlewares: IMiddleware<Data>[],
    private readonly errorMiddlewares: IErrorMiddleware<Data>[],
    readonly data: Data,
    private readonly logger?: ILogger,
  ) {
    this.middlewares = middlewares;
    this.middlewareStates = new Map();
    this.isDisposed = false;
  }

  public use(...middleware: IMiddleware<Data>[]): this {
    this.middlewares.push(...middleware);
    return this;
  }

  public error(...errorMiddleware: IErrorMiddleware<Data>[]): this {
    this.errorMiddlewares.push(...errorMiddleware);
    return this;
  }

  public async execute(): Promise<void> {
    if (this.isDisposed) {
      throw new Error("Cannot execute a disposed request.");
    }

    const executedMiddlewares: ExecutedMiddlewares<Data> = new Set();

    try {
      await this.executeNext(executedMiddlewares, 0);
    } catch (error) {
      await this.handleNextError(executedMiddlewares, 0, error as Error);
    } finally {
      await this.cleanupSubscriptions(executedMiddlewares);
    }
  }

  private async executeNext(
    executedMiddlewares: ExecutedMiddlewares<Data>,
    nextIndex: number,
  ): Promise<void> {
    if (nextIndex >= this.middlewares.length) {
      return;
    }

    const middleware = this.middlewares[nextIndex]!;
    let currentState = this.middlewareStates.get(middleware);

    if (!currentState) {
      currentState = new Map<string, IMiddlewareState>();
      this.middlewareStates.set(middleware, currentState);
    }

    this.markMiddlewareSubscriptionsInactive(currentState);

    await middleware(
      this.data,
      () => this.executeNext(executedMiddlewares, nextIndex + 1),
      this.triggerReRun.bind(this),
      subscribe.bind(null, currentState),
    );

    executedMiddlewares.add(middleware);
  }

  private async triggerReRun(): Promise<void> {
    this.logger?.info("Re-run triggered.");
    await this.execute();
  }

  private async handleNextError(
    executedMiddlewares: ExecutedMiddlewares<Data>,
    nextIndex: number,
    error: Error,
  ): Promise<void> {
    if (nextIndex >= this.errorMiddlewares.length) {
      this.logger?.error("Unhandled error:", error);
      throw error;
    }

    try {
      const errorMiddleware = this.errorMiddlewares[nextIndex]!;
      let currentState = this.middlewareStates.get(errorMiddleware);

      if (!currentState) {
        currentState = new Map<string, IMiddlewareState>();
        this.middlewareStates.set(errorMiddleware, currentState);
      }

      await errorMiddleware(
        error,
        this.data,
        () => this.handleNextError(executedMiddlewares, nextIndex + 1, error),
        this.triggerReRun.bind(this),
        subscribe.bind(null, currentState),
      );

      executedMiddlewares.add(errorMiddleware);
    } catch (error) {
      await this.handleNextError(
        executedMiddlewares,
        nextIndex + 1,
        error as Error,
      );
    }
  }

  private markMiddlewareSubscriptionsInactive(
    state: Map<string, IMiddlewareState>,
  ): void {
    for (const middlewareState of state.values()) {
      middlewareState.active = false;
    }
  }

  private async cleanupSubscriptions(
    executedMiddlewares: ExecutedMiddlewares<Data>,
  ): Promise<void> {
    for (const [middleware, state] of this.middlewareStates.entries()) {
      if (executedMiddlewares.has(middleware)) {
        for (const [key, subscription] of state) {
          if (!subscription.active) {
            await subscription.unsubscribe();
            state.delete(key);
          }
        }
      } else {
        this.disposeMiddlewareSubscriptions(middleware, state);
      }
    }
  }

  private disposeMiddlewareSubscriptions(
    middleware: IMiddleware<Data> | IErrorMiddleware<Data>,
    state: Map<string, IMiddlewareState>,
  ): void {
    this.logger?.info(
      `Disposing subscriptions for middleware: ${middleware.name || "anonymous"}`,
    );
    for (const [key, { unsubscribe }] of state.entries()) {
      try {
        unsubscribe();
        this.logger?.info(`Unsubscribed from ${key}.`);
      } catch (error) {
        this.logger?.error(`Error unsubscribing from ${key}:`, error);
      }
    }
    state.clear();
  }

  public dispose(): void {
    if (this.isDisposed) {
      return;
    }

    this.isDisposed = true;
    this.logger?.info("Disposing all subscriptions and request.");

    for (const [middleware, state] of this.middlewareStates.entries()) {
      this.disposeMiddlewareSubscriptions(middleware, state);
    }

    this.middlewareStates.clear();
  }
}

function areDependenciesEqual(
  depsA: any[] | undefined,
  depsB: any[] | undefined,
): boolean {
  if (depsA === undefined && depsB === undefined) return true;
  if (depsA === undefined || depsB === undefined) return false;
  if (depsA.length === 0 && depsB.length === 0) return true;
  if (depsA.length !== depsB.length) return false;
  for (let i = 0; i < depsA.length; i++) {
    if (depsA[i] !== depsB[i]) return false;
  }
  return true;
}

async function subscribe(
  state: Map<string, IMiddlewareState>,
  key: string,
  subscribeFn: () => IMiddlewareUnsubscribe | Promise<IMiddlewareUnsubscribe>,
  dependencies?: any[],
): Promise<void> {
  const existingSubscription = state.get(key);

  if (
    existingSubscription &&
    areDependenciesEqual(existingSubscription.dependencies, dependencies)
  ) {
    return;
  }

  if (existingSubscription) {
    await existingSubscription.unsubscribe();
    state.delete(key);
  }

  const unsubscribe = await subscribeFn();
  state.set(key, { dependencies, unsubscribe, active: true });
}
