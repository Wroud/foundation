import type { IServiceDescriptor } from "../../types/IServiceDescriptor.js";
import { getNameOfDescriptor } from "../../helpers/getNameOfDescriptor.js";

export function validateRequestPath<T>(
  path: Set<IServiceDescriptor<any>>,
  descriptor: IServiceDescriptor<T>,
) {
  if (path.has(descriptor)) {
    throw new Error(
      `Cyclic dependency detected: ${[...path, descriptor]
        .map(getNameOfDescriptor)
        .join(" -> ")}`,
    );
  }
}
