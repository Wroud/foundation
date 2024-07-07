import type { FileInfo } from "jscodeshift";
import path from "node:path";
import type { ITransformerOptions } from "./ITransformerOptions.js";

export function getModulePath(
  file: FileInfo,
  transformerOptions: ITransformerOptions,
) {
  const pathWithoutExtension = path.join(file.path.replace(/\.[^/.]+$/, ""));
  const ext = path.extname(file.path);

  if (transformerOptions.esm) {
    switch (ext) {
      case ".ts":
        return `${pathWithoutExtension}.js`;
      case ".tsx":
        return `${pathWithoutExtension}.jsx`;
      default:
        return pathWithoutExtension + ext;
    }
  }

  return pathWithoutExtension;
}
