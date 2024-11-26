import type { ILogger } from "@wroud/api-logger";
import type { IErrorMiddleware } from "./interfaces/IErrorMiddleware.js";
import type { IMiddleware } from "./interfaces/IMiddleware.js";
import type { IMiddlewareRequest } from "./interfaces/IMiddlewareRequest.js";

type MiddlewareStates<Data> = Map<IMiddleware<Data>, Map<string, () => void>>;
type ErrorMiddlewareStates<Data> = Map<
  IErrorMiddleware<Data>,
  Map<string, () => void>
>;

/**
 * Class representing a middleware request.
 * @template Data - The shape of the request data.
 */
export class MiddlewareRequest<Data = Record<string, any>>
  implements IMiddlewareRequest<Data>
{
  public data: Data;
  private middlewareStates: MiddlewareStates<Data>;
  private errorMiddlewareStates: ErrorMiddlewareStates<Data>;
  private isDisposed: boolean;

  /**
   * Creates an instance of MiddlewareRequest.
   * @param {Middleware<Data>[]} middlewares - Array of middleware functions.
   * @param {Data} initialData - Initial data for the request.
   */
  constructor(
    private readonly middlewares: IMiddleware<Data>[],
    private readonly errorMiddlewares: IErrorMiddleware<Data>[],
    initialData: Data,
    private readonly logger?: ILogger,
  ) {
    this.middlewares = middlewares;
    this.data = { ...initialData };
    this.middlewareStates = new Map();
    this.errorMiddlewareStates = new Map();
    this.isDisposed = false;
  }

  /**
   * Executes the middleware chain.
   */
  public async execute(): Promise<void> {
    if (this.isDisposed) {
      throw new Error("Cannot execute a disposed request.");
    }

    try {
      const newMiddlewareStates: MiddlewareStates<Data> = new Map();

      for (let i = 0; i < this.middlewares.length; i++) {
        const middleware = this.middlewares[i]!;
        const currentState =
          this.middlewareStates.get(middleware) ||
          new Map<string, () => void>();

        /**
         * Subscribes to an external event.
         * @param {string} key - Unique key for the subscription.
         * @param {() => () => void} subscribeFn - Function that sets up the subscription and returns an unsubscribe function.
         */
        const subscribe = (
          key: string,
          subscribeFn: () => () => void,
        ): void => {
          if (currentState.has(key)) {
            return; // Subscription already exists.
          }

          const unsubscribe = subscribeFn();
          currentState.set(key, unsubscribe);
        };

        await middleware(
          this.data,
          () => this.executeNext(i + 1),
          this.triggerReRun.bind(this),
          subscribe,
        );

        newMiddlewareStates.set(middleware, currentState);
      }

      this.setMiddlewareStates(newMiddlewareStates);
    } catch (error) {
      await this.handleError(error as Error);
    }
  }

  /**
   * Executes the next middleware in the chain.
   * @param {number} nextIndex - Index of the next middleware to execute.
   */
  private async executeNext(nextIndex: number): Promise<void> {
    if (nextIndex >= this.middlewares.length) return;

    const middleware = this.middlewares[nextIndex]!;
    const currentState =
      this.middlewareStates.get(middleware) || new Map<string, () => void>();

    /**
     * Subscribes to an external event.
     * @param {string} key - Unique key for the subscription.
     * @param {() => () => void} subscribeFn - Function that sets up the subscription and returns an unsubscribe function.
     */
    const subscribe = (key: string, subscribeFn: () => () => void): void => {
      if (currentState.has(key)) {
        return; // Subscription already exists.
      }

      const unsubscribe = subscribeFn();
      currentState.set(key, unsubscribe);
    };

    try {
      await middleware(
        this.data,
        () => this.executeNext(nextIndex + 1),
        this.triggerReRun.bind(this),
        subscribe,
      );

      this.middlewareStates.set(middleware, currentState);
    } catch (error) {
      await this.handleError(error as Error);
    }
  }

  /**
   * Triggers a re-execution of the middleware chain.
   */
  private async triggerReRun(): Promise<void> {
    if (this.isDisposed) return;
    this.logger?.info("Re-run triggered.");
    await this.execute();
  }

  /**
   * Handles errors by executing error-handling middlewares.
   * @param {Error} error - The error to handle.
   */
  private async handleError(error: Error): Promise<void> {
    if (this.isDisposed) {
      this.logger?.error("Cannot handle error for a disposed request:", error);
      return;
    }

    if (this.errorMiddlewares.length === 0) {
      this.logger?.error("Unhandled error:", error);
      return;
    }

    try {
      const newErrorMiddlewareStates: ErrorMiddlewareStates<Data> = new Map();

      for (let i = 0; i < this.errorMiddlewares.length; i++) {
        const errorMiddleware = this.errorMiddlewares[i]!;
        const currentState =
          this.errorMiddlewareStates.get(errorMiddleware) ||
          new Map<string, () => void>();

        /**
         * Subscribes to an external event.
         * @param {string} key - Unique key for the subscription.
         * @param {() => () => void} subscribeFn - Function that sets up the subscription and returns an unsubscribe function.
         */
        const subscribe = (
          key: string,
          subscribeFn: () => () => void,
        ): void => {
          if (currentState.has(key)) {
            return; // Subscription already exists.
          }

          const unsubscribe = subscribeFn();
          currentState.set(key, unsubscribe);
        };

        await errorMiddleware(
          error,
          this.data,
          () => this.execute(),
          this.triggerReRun.bind(this),
          subscribe,
        );

        newErrorMiddlewareStates.set(errorMiddleware, currentState);
      }

      this.setErrorMiddlewareStates(newErrorMiddlewareStates);
    } catch (err) {
      this.logger?.error("Error in error-handling middleware:", err);
    }
  }

  private setMiddlewareStates(
    newMiddlewareStates: MiddlewareStates<Data>,
  ): void {
    this.cleanupSubscriptions(newMiddlewareStates);
    this.middlewareStates = newMiddlewareStates;
  }

  private setErrorMiddlewareStates(
    newErrorMiddlewareStates: ErrorMiddlewareStates<Data>,
  ): void {
    this.cleanupErrorSubscriptions(newErrorMiddlewareStates);
    this.errorMiddlewareStates = newErrorMiddlewareStates;
  }

  /**
   * Cleans up subscriptions that are no longer active in regular middlewares.
   * @param {Map<Middleware<Data>, Map<string, () => void>>} newMiddlewareStates - The updated middleware states after execution.
   */
  private cleanupSubscriptions(
    newMiddlewareStates: Map<IMiddleware<Data>, Map<string, () => void>>,
  ): void {
    for (const [middleware, state] of this.middlewareStates.entries()) {
      if (!newMiddlewareStates.has(middleware)) {
        this.disposeMiddlewareSubscriptions(middleware, state);
      }
    }
  }

  /**
   * Cleans up subscriptions that are no longer active in error middlewares.
   * @param {Map<ErrorMiddleware<Data>, Map<string, () => void>>} newErrorMiddlewareStates - The updated error middleware states after execution.
   */
  private cleanupErrorSubscriptions(
    newErrorMiddlewareStates: Map<
      IErrorMiddleware<Data>,
      Map<string, () => void>
    >,
  ): void {
    for (const [
      errorMiddleware,
      state,
    ] of this.errorMiddlewareStates.entries()) {
      if (!newErrorMiddlewareStates.has(errorMiddleware)) {
        this.disposeErrorMiddlewareSubscriptions(errorMiddleware, state);
      }
    }
  }

  /**
   * Disposes all subscriptions for a specific regular middleware.
   * @param {Middleware<Data>} middleware - The middleware whose subscriptions are to be disposed.
   * @param {Map<string, () => void>} state - The subscription state of the middleware.
   */
  private disposeMiddlewareSubscriptions(
    middleware: IMiddleware<Data>,
    state: Map<string, () => void>,
  ): void {
    this.logger?.info(
      `Disposing subscriptions for middleware: ${middleware.name || "anonymous"}`,
    );
    for (const [key, unsubscribe] of state.entries()) {
      try {
        unsubscribe();
        this.logger?.info(`Unsubscribed from ${key}.`);
      } catch (error) {
        this.logger?.error(`Error unsubscribing from ${key}:`, error);
      }
    }
    state.clear();
  }

  /**
   * Disposes all subscriptions for a specific error middleware.
   * @param {ErrorMiddleware<Data>} errorMiddleware - The error middleware whose subscriptions are to be disposed.
   * @param {Map<string, () => void>} state - The subscription state of the error middleware.
   */
  private disposeErrorMiddlewareSubscriptions(
    errorMiddleware: IErrorMiddleware<Data>,
    state: Map<string, () => void>,
  ): void {
    this.logger?.info(
      `Disposing subscriptions for error middleware: ${errorMiddleware.name || "anonymous"}`,
    );
    for (const [key, unsubscribe] of state.entries()) {
      try {
        unsubscribe();
        this.logger?.info(`Unsubscribed from ${key}.`);
      } catch (error) {
        this.logger?.error(`Error unsubscribing from ${key}:`, error);
      }
    }
    state.clear();
  }

  /**
   * Disposes the request and all active subscriptions.
   */
  public dispose(): void {
    if (this.isDisposed) return;

    this.isDisposed = true;
    this.logger?.info("Disposing all subscriptions and request.");

    // Dispose regular middlewares
    for (const [middleware, state] of this.middlewareStates.entries()) {
      this.disposeMiddlewareSubscriptions(middleware, state);
    }

    // Dispose error middlewares
    for (const [
      errorMiddleware,
      state,
    ] of this.errorMiddlewareStates.entries()) {
      this.disposeErrorMiddlewareSubscriptions(errorMiddleware, state);
    }

    this.middlewareStates.clear();
    this.errorMiddlewareStates.clear();
  }
}
