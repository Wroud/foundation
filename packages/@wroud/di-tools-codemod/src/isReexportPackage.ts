import type { ISupportedPackage } from "./ISupportedPackage.js";

export function isReexportPackage(
  supportedPackage: ISupportedPackage,
): boolean {
  return supportedPackage.name === supportedPackage.replace;
}
