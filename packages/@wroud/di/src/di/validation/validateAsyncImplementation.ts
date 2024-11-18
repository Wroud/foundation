import { Debug } from "../../debug.js";
import { isAsyncServiceImplementationResolver } from "../../implementation-resolvers/isAsyncServiceImplementation.js";
import type { IServiceCollection } from "../../types/index.js";

export function validateAsyncImplementation(
  collection: IServiceCollection,
): void {
  for (const descriptor of collection) {
    if (isAsyncServiceImplementationResolver(descriptor.resolver)) {
      console.warn(Debug.warnings.asyncValidation(descriptor));
    }
  }
}
