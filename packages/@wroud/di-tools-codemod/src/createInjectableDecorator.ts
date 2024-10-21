import type { JSCodeshift } from "jscodeshift";
import type { IInjectableDependencyInfo } from "./IInjectableDependencyInfo.js";
import { CONSTANTS } from "./constants.js";

export function createInjectableDecorator(
  j: JSCodeshift,
  dependencies: IInjectableDependencyInfo[],
) {
  const arrayExpression = j.arrayExpression(
    dependencies.map((dep) => {
      if (dep.multiple) {
        return j.arrayExpression([dep.type]);
      }
      return dep.type;
    }),
  );

  const newCallExpression = j.callExpression(
    j.identifier(CONSTANTS.injectable),
    dependencies.length > 0
      ? [j.arrowFunctionExpression([], arrayExpression)]
      : [],
  );

  return j.decorator(newCallExpression);
}
