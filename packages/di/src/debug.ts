import { getNameOfServiceType } from "./helpers/getNameOfServiceType.js";
import type { IServiceDescriptor } from "./types/index.js";

export class Debug {
  public static extended = false;
  public static errors = {
    lazyServiceCantResolveSync: "Lazy service cannot be resolved synchronously",
    serviceNotLoaded: (loader: Function) => "Service is not loaded yet",
    classNotDecorated: (name: string) =>
      `Class "${name}" not registered as service`,
  };
  public static warnings = {
    asyncValidation: (descriptor: IServiceDescriptor<unknown>) =>
      `Service "${getNameOfServiceType(descriptor.service)}" is async and cannot be validated synchronously.`,
  };
}
