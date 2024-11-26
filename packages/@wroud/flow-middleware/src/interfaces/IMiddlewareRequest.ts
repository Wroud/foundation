/**
 * Interface for the MiddlewareRequest class.
 * @template Data - The shape of the request data.
 */
export interface IMiddlewareRequest<Data = Record<string, any>> {
  /**
   * Executes the middleware chain.
   */
  execute(): Promise<void>;

  /**
   * Disposes the request and all active subscriptions.
   */
  dispose(): void;
}
