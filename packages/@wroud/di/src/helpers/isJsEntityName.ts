export function isJsEntityName(name: string): boolean {
  return [
    "Function",
    "Object",
    "Array",
    "String",
    "Number",
    "Boolean",
  ].includes(name);
}
