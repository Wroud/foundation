export interface IParsedPackageName {
  scope: string | null;
  name: string;
  packageName: string;
}

export function parsePackageName(
  name: string,
  baseScope?: string | null,
): IParsedPackageName {
  const result: IParsedPackageName = {
    scope: null,
    name,
    packageName: name,
  };

  if (name.startsWith("@") && name.includes("/")) {
    const [org, ...rest] = name.split("/");
    result.scope = org!;
    result.name = rest.join("/");
  } else if (baseScope) {
    result.scope = baseScope;
    result.packageName = `${baseScope}/${name}`;
  }

  return result;
}
