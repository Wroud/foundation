import { Debug } from "./debug.js";
import { getNameOfServiceType } from "./helpers/getNameOfServiceType.js";
import type { IServiceDescriptor } from "./types/index.js";

Debug.extended = true;
Debug.errors = {
  ...Debug.errors,
  serviceNotLoaded: (loader: Function) =>
    `Service implementation not loaded, loader: ${String(loader)}`,
  classNotDecorated: (name: string) =>
    `Class "${name}" not registered as service (please use @injectable or ServiceRegistry)`,
  optionalServiceAsDependency: (name: string, from: string) =>
    `Optional service ${name} cannot be resolved during construction of service ${from}. Please convert it to a regular dependency.`,
};
Debug.warnings = {
  asyncValidation: (descriptor: IServiceDescriptor<unknown>) =>
    `Service implementation for "${getNameOfServiceType(descriptor.service)}" is async and cannot be validated synchronously. You can use builder.validate() to validate dependencies asynchronously.`,
};
