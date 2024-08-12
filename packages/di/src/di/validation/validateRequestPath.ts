import type { IServiceDescriptor } from "../../interfaces/IServiceDescriptor.js";
import { getNameOfServiceType } from "../../helpers/getNameOfServiceType.js";

export function validateRequestPath<T>(
  path: Set<IServiceDescriptor<any>>,
  descriptor: IServiceDescriptor<T>,
) {
  if (path.has(descriptor)) {
    throw new Error(
      `Cyclic dependency detected: ${[...path, descriptor]
        .map((descriptor) => {
          const implementationName = getNameOfServiceType(
            descriptor.implementation,
          );
          const serviceName = getNameOfServiceType(descriptor.service);
          return implementationName === serviceName
            ? implementationName
            : `${implementationName} (${serviceName})`;
        })
        .join(" -> ")}`,
    );
  }
}
