import type { Collection, FileInfo, JSCodeshift } from "jscodeshift";
import { findSrcDir } from "./findSrcDir.js";
import path from "node:path";
import fs from "node:fs";
import type { ISupportedPackage } from "./ISupportedPackage.js";
import type { ITransformerOptions } from "./ITransformerOptions.js";
import { getModulePath } from "./getModulePath.js";

export function addServiceToModule(
  file: FileInfo,
  j: JSCodeshift,
  transformerOptions: ITransformerOptions,
  classes: string[],
  replacingPackage: ISupportedPackage,
) {
  const srcPath = findSrcDir(file.path);

  if (!srcPath) {
    return;
  }

  const filePath = getModulePath(file, transformerOptions);
  const packageJsonPath = `${srcPath}/../package.json`;
  const modulePath = `${srcPath}/module.ts`;

  let name = path.basename(path.dirname(srcPath));
  let moduleRoot: Collection<any> | null = null;

  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

    if (packageJson.name) {
      name = packageJson.name;
    }

    // if (!packageJson.sideEffects || !Array.isArray(packageJson.sideEffects)) {
    //   packageJson.sideEffects = [];
    // }

    // let relativeModulePath = path.relative(
    //   path.dirname(packageJsonPath),
    //   modulePath,
    // );

    // if (!relativeModulePath.startsWith(".")) {
    //   relativeModulePath = "./" + relativeModulePath;
    // }

    // if (!packageJson.sideEffects.includes(relativeModulePath)) {
    //   packageJson.sideEffects.push(relativeModulePath);
    // }

    // fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  }

  if (!fs.existsSync(modulePath)) {
    moduleRoot = j(
      j.program([
        j.importDeclaration.from({
          specifiers: [j.importSpecifier(j.identifier("ModuleRegistry"))],
          source: j.literal(replacingPackage.replace),
          comments: transformerOptions.copyright
            ? [j.commentBlock(transformerOptions.copyright, true, true)]
            : [],
        }),
        j.expressionStatement(
          j.callExpression(
            j.memberExpression(
              j.identifier("ModuleRegistry"),
              j.identifier("add"),
            ),
            [
              j.objectExpression([
                j.objectProperty(j.identifier("name"), j.literal(name)),
                j.objectProperty(
                  j.identifier("configure"),
                  j.arrowFunctionExpression(
                    [j.identifier("serviceCollection")],
                    j.blockStatement([]),
                  ),
                ),
              ]),
            ],
          ),
        ),
      ]),
    );
  }

  if (!moduleRoot) {
    const moduleSource = fs.readFileSync(modulePath, "utf-8");
    moduleRoot = j(moduleSource);
  }

  for (const className of classes) {
    const importPath =
      "./" + path.relative(path.dirname(modulePath), path.join(filePath));

    let classFileImport = moduleRoot.find(j.ImportDeclaration, {
      source: {
        value: importPath,
      },
    });

    if (!classFileImport.length) {
      classFileImport = moduleRoot
        .find(j.ImportDeclaration)
        .at(0)
        .insertAfter(j.importDeclaration([], j.literal(importPath)));

      classFileImport = moduleRoot.find(j.ImportDeclaration, {
        source: {
          value: importPath,
        },
      });
    }

    if (
      !classFileImport.find(j.ImportSpecifier, {
        imported: { name: className },
      }).length
    ) {
      const freeName = getFreeImportName(j, moduleRoot, className);

      classFileImport
        .nodes()[0]
        ?.specifiers?.push(
          j.importSpecifier(
            j.identifier(className),
            className !== freeName ? j.identifier(freeName) : null,
          ),
        );

      const block = moduleRoot
        .find(j.ArrowFunctionExpression, {
          params: [{ name: "serviceCollection" }],
        })
        .find(j.BlockStatement)
        .nodes()[0];

      if (block) {
        const exists = moduleRoot.find(j.CallExpression, {
          callee: {
            type: "MemberExpression",
            object: { type: "Identifier", name: "serviceCollection" },
            property: { type: "Identifier", name: "addSingleton" },
          },
        });

        if (exists.length) {
          exists.replaceWith((path) => {
            const node = path.node;

            const chained = j.callExpression(
              j.memberExpression(node, j.identifier("addSingleton")),
              [j.identifier(freeName)],
            );

            chained.comments = node.comments;

            return chained;
          });
        } else {
          block.body.push(
            j.expressionStatement(
              j.callExpression(
                j.memberExpression(
                  j.identifier("serviceCollection"),
                  j.identifier("addSingleton"),
                ),
                [j.identifier(freeName)],
              ),
            ),
          );
        }
      }
    }
  }

  fs.writeFileSync(modulePath, moduleRoot.toSource());
}

function getFreeImportName(
  j: JSCodeshift,
  root: Collection<any>,
  baseName: string,
): string {
  const importNames = new Set<string>();

  root.find(j.ImportDeclaration).forEach((path) => {
    path.value.specifiers?.forEach((specifier) => {
      if (specifier.type === "ImportSpecifier") {
        let name = specifier.local?.name || specifier.imported.name;
        if (typeof name !== "string" && name && typeof name.name === "string") {
          importNames.add(name.name);
        } else if (typeof name === "string") {
          importNames.add(name);
        }
      }
    });
  });

  let i = 0;
  let name = `${baseName}`;

  while (importNames.has(name)) {
    i++;
    name = `${baseName}${i}`;
  }

  return name;
}
