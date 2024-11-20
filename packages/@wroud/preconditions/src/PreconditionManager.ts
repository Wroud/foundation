import type { IPrecondition } from "./IPrecondition.js";

export class PreconditionManager<T> {
  private preconditions: IPrecondition<T>[] = [];

  /**
   * Registers a new precondition for this entity type.
   * @param precondition - The precondition to register.
   */
  public register(precondition: IPrecondition<T>): void {
    this.preconditions.push(precondition);
  }

  /**
   * Checks if all applicable preconditions are fulfilled for the given entity instance.
   * @param entity - The entity instance.
   * @return {Promise<boolean>} - Resolves to true if all applicable preconditions are fulfilled.
   */
  public async checkPreconditions(entity: T): Promise<boolean> {
    for (const precondition of this.getApplicablePreconditions(entity)) {
      const isFulfilled = await precondition.check(entity);
      if (!isFulfilled) {
        return false;
      }
    }
    return true;
  }

  /**
   * Attempts to fulfill all applicable preconditions for the given entity instance.
   * @param entity - The entity instance.
   * @return {Promise<void>}
   */
  public async fulfillPreconditions(entity: T): Promise<void> {
    for (const precondition of this.getApplicablePreconditions(entity)) {
      const isFulfilled = await precondition.check(entity);
      if (!isFulfilled) {
        await precondition.fulfill(entity);
      }
    }
  }

  public *getApplicablePreconditions(entity: T): Iterable<IPrecondition<T>> {
    for (const precondition of this.preconditions) {
      if (precondition.isApplicable(entity)) {
        yield precondition;
      }
    }
  }
}
