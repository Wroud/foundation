import type { API, FileInfo } from "jscodeshift";
import { transformDecorators } from "./transformDecorators.js";
import { transformImports } from "./transformImports.js";
import { ISupportedPackage } from "./ISupportedPackage.js";
import { addServiceToModule } from "./addServiceToModule.js";
import { IMigrationOptions } from "./IMigrationOptions.js";

export const parser = "tsx";
export default function transform(
  file: FileInfo,
  api: API,
  cliOptions?: Partial<IMigrationOptions>,
): string | undefined {
  const options: IMigrationOptions = {
    generateModule: true,
    ...cliOptions,
    transformer: {
      esm: false,
      ...cliOptions?.transformer,
    },
  };
  const j = api.jscodeshift;
  const root = j(file.source);

  const packages = getSupportedPackages(options);

  const replacingPackage = transformImports(j, root, packages);

  if (replacingPackage) {
    const decoratedClasses = transformDecorators(j, root, replacingPackage);

    if (decoratedClasses.length && options.generateModule) {
      addServiceToModule(
        file,
        j,
        options.transformer!,
        decoratedClasses,
        replacingPackage,
      );
    }
  }

  return root.toSource();
}

function getSupportedPackages(
  options?: IMigrationOptions,
): ISupportedPackage[] {
  if (options?.supportedPackages) {
    return options.supportedPackages;
  }

  return basePackages;
}

const basePackages: ISupportedPackage[] = [
  {
    name: "inversify",
    replace: "@wroud/di",
    injectableDecorator: "injectable",
    injectDecorator: "inject",
    multiInjectDecorator: "multiInject",
  },
];
