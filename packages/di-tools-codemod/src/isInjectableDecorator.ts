import { Decorator } from "jscodeshift";
import { ISupportedPackage } from "./ISupportedPackage.js";

export function isInjectableDecorator(
  packages: ISupportedPackage[],
  decorator: Decorator,
): decorator is Decorator {
  if (
    decorator.expression.type !== "CallExpression" ||
    decorator.expression.callee.type !== "Identifier"
  ) {
    return false;
  }
  const name = decorator.expression.callee.name;
  return packages.some((p) => p.injectableDecorator === name);
}
