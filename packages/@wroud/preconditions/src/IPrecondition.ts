export interface IPrecondition<T> {
  /**
   * Determines if this precondition applies to the given data.
   * @param data - The data to check applicability for.
   * @return {boolean} - True if applicable, false otherwise.
   */
  isApplicable(data: T): boolean;

  /**
   * Checks if the precondition is already fulfilled.
   * @param data - The data context.
   * @return {Promise<boolean>} - Resolves to true if fulfilled, false otherwise.
   */
  check(data: T): Promise<boolean>;

  /**
   * Attempts to fulfill the precondition.
   * @param data - The data context.
   * @return {Promise<void>}
   */
  fulfill(data: T): Promise<void>;
}
