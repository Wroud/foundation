import {
  ClassPrivateMethod,
  Collection,
  Identifier,
  JSCodeshift,
  TSParameterProperty,
} from "jscodeshift";
import { IInjectableDependencyInfo } from "./IInjectableDependencyInfo.js";
import { WithDecorators } from "./WithDecorators.js";
import { isMultipleInjectDecorator } from "./isMultipleInjectDecorator.js";
import { isConstructorInjectDecorator } from "./isConstructorInjectDecorator.js";
import { isInjectableDecorator } from "./isInjectableDecorator.js";
import { createInjectableDecorator } from "./createInjectableDecorator.js";
import { ISupportedPackage } from "./ISupportedPackage.js";

export function transformDecorators(
  j: JSCodeshift,
  root: Collection<any>,
  replacingPackage: ISupportedPackage,
): string[] {
  const decoratedClasses: string[] = [];

  root.find(j.ClassDeclaration).forEach((path) => {
    const decorators =
      (path.node as unknown as ClassPrivateMethod).decorators || [];

    const newDecorators = [
      ...decorators.filter(
        (decorator) => !isInjectableDecorator([replacingPackage], decorator),
      ),
    ];

    if (newDecorators.length === decorators.length) {
      return;
    }

    const constructors = j(path)
      .find(j.ClassBody)
      .filter((p) => p.parentPath.node === path.node)
      .map((path) =>
        j(path)
          .find(j.ClassMethod, { kind: "constructor" })
          .filter((p) => p.parentPath.node === path.node)
          .paths(),
      );

    const constructorParams: Collection<TSParameterProperty | Identifier> =
      constructors.map((path) =>
        j(path)
          .find<TSParameterProperty | Identifier>(j.Pattern as any, (node) => {
            if (node.type === "TSParameterProperty") {
              return true;
            }

            return node.type === "Identifier" && node.name !== "constructor";
          })
          .filter((p) => p.parentPath.node === path.node)
          .paths(),
      );

    const dependencies: IInjectableDependencyInfo[] = [];

    for (const param of constructorParams.nodes()) {
      const decorators =
        (param as WithDecorators<TSParameterProperty>).decorators || [];
      let type = j(param).find(j.TSTypeReference).nodes()[0]?.typeName as
        | Identifier
        | undefined;

      if (!type && param.type === "Identifier") {
        type = j(param).find(j.TSTypeAnnotation).nodes()[0]?.typeAnnotation as
          | Identifier
          | undefined;
      }

      if (!type) {
        dependencies.push({ type: j.nullLiteral() as any, multiple: false });
        continue;
      }

      const multiple = decorators.some((decorator) =>
        isMultipleInjectDecorator([replacingPackage], decorator),
      );

      dependencies.push({ type: type as Identifier, multiple });
      (param as any).decorators = decorators.filter(
        (decorator) =>
          !isConstructorInjectDecorator([replacingPackage], decorator),
      );
    }

    newDecorators.push(createInjectableDecorator(j, dependencies));

    if (path.node.id) {
      decoratedClasses.push(path.node.id.name);
    }

    (path.node as any).decorators = newDecorators;
  });

  return decoratedClasses;
}
