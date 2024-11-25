import type { IServiceDescriptor, RequestPath } from "../../types/index.js";
import { getNameOfDescriptor } from "../../helpers/getNameOfDescriptor.js";
import { requestPathToArray } from "../../helpers/requestPathToArray.js";

export function validateRequestPath<T>(
  path: RequestPath,
  descriptor: IServiceDescriptor<T>,
) {
  for (let node: RequestPath | null = path; node; node = node.next) {
    if (node.value === descriptor) {
      throw new Error(
        `Cyclic dependency detected: ${[descriptor, ...requestPathToArray(path)]
          .reverse()
          .filter((v) => v !== null)
          .map(getNameOfDescriptor)
          .join(" -> ")}`,
      );
    }
  }
}
