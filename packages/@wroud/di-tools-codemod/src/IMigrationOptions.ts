import type { ITransformerOptions } from "./ITransformerOptions.js";
import type { ISupportedPackage } from "./ISupportedPackage.js";

export interface IMigrationOptions {
  transformer?: ITransformerOptions;
  supportedPackages?: ISupportedPackage[];
  generateModule?: boolean;
}
