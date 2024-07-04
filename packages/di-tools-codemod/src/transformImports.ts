import {
  ASTPath,
  Collection,
  JSCodeshift,
  ImportDeclaration,
} from "jscodeshift";
import { ISupportedPackage } from "./ISupportedPackage.js";
import { isReexportPackage } from "./isReexportPackage.js";
import { CONSTANTS } from "./constants.js";

export function transformImports(
  j: JSCodeshift,
  root: Collection<any>,
  packages: ISupportedPackage[],
): ISupportedPackage | null {
  let migrationPackage: ISupportedPackage | null = null;
  let importPath: ASTPath<ImportDeclaration> | null = null;

  root.find(j.ImportDeclaration).forEach((path) => {
    for (const packageTransforms of packages) {
      if (
        migrationPackage ||
        packageTransforms.name !== path.value.source.value
      ) {
        continue;
      }

      const specifiers = path.value.specifiers?.filter((specifier) => {
        if (specifier.type === "ImportSpecifier") {
          if (
            packageTransforms.injectableDecorator === specifier.imported.name
          ) {
            migrationPackage = packageTransforms;

            if (isReexportPackage(packageTransforms)) {
              return true;
            }
          }

          return (
            packageTransforms.injectDecorator !== specifier.imported.name &&
            packageTransforms.multiInjectDecorator !==
              specifier.imported.name &&
            packageTransforms.injectableDecorator !== specifier.imported.name
          );
        }
        return true;
      });

      importPath = path;
      path.value.specifiers = specifiers;
    }
  });

  if (migrationPackage && !isReexportPackage(migrationPackage)) {
    const importDeclaration = j.importDeclaration(
      [
        j.importSpecifier(
          j.identifier(
            (migrationPackage as ISupportedPackage).injectableDecorator ||
              CONSTANTS.injectable,
          ),
        ),
      ],
      j.literal((migrationPackage as ISupportedPackage).replace),
    );

    if (importPath) {
      importPath = importPath as ASTPath<ImportDeclaration>;
      if (!importPath.node.specifiers?.length) {
        importDeclaration.comments = importPath.node.comments;
        importPath.replace(importDeclaration);
      } else {
        importPath.insertAfter(importDeclaration);
      }
    } else {
      root.get().node.body.unshift(importDeclaration);
    }
  }

  return migrationPackage;
}
