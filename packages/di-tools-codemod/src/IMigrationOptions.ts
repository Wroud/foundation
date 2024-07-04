import { ITransformerOptions } from "./ITransformerOptions.js";
import { ISupportedPackage } from "./ISupportedPackage.js";

export interface IMigrationOptions {
  transformer?: ITransformerOptions;
  supportedPackages?: ISupportedPackage[];
  generateModule?: boolean;
}
