import { Decorator } from "jscodeshift";
import type { ISupportedPackage } from "./ISupportedPackage.js";

export function isConstructorInjectDecorator(
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

  return packages.some(
    (p) => p.injectDecorator === name || p.multiInjectDecorator === name,
  );
}
