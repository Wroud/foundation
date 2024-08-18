import { Debug } from "../../debug.js";
import { isAsyncServiceImplementationLoader } from "../../helpers/isAsyncServiceImplementationLoader.js";
import type { IServiceCollection } from "../../production.js";

export function validateAsyncImplementation(
  collection: IServiceCollection,
): void {
  for (const descriptor of collection) {
    if (isAsyncServiceImplementationLoader(descriptor.implementation)) {
      console.warn(Debug.warnings.asyncValidation(descriptor));
    }
  }
}
