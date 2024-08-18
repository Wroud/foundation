import { Debug } from "./debug.js";
import { getNameOfServiceType } from "./helpers/getNameOfServiceType.js";
import type { IServiceDescriptor } from "./interfaces/IServiceDescriptor.js";

Debug.extended = true;
Debug.errors = {
  serviceNotLoaded: (loader: Function) =>
    `Service implementation not loaded, loader: ${String(loader)}`,
  classNotDecorated: (name: string) =>
    `Class "${name}" not registered as service (please use @injectable or ServiceRegistry)`,
};
Debug.warnings = {
  asyncValidation: (descriptor: IServiceDescriptor<unknown>) =>
    `Service implementation for "${getNameOfServiceType(descriptor.service)}" is async and cannot be validated synchronously. You can use builder.validate() to validate dependencies asynchronously.`,
};
