import { join, resolve } from "path";

export interface IProjectPaths {
  directory: string;
  packageJsonPath: string;
  tsConfigPath: string;
}

export function getProjectPaths(path: string): IProjectPaths {
  let packageJsonPath = path;
  let tsConfigPath = path;

  if (path.endsWith(".json")) {
    tsConfigPath = path;
    packageJsonPath = join(path, "..", "package.json");
    path = join(path, "..");
  } else {
    tsConfigPath = join(path, "tsconfig.json");
    packageJsonPath = join(path, "package.json");
  }

  return {
    directory: resolve(path),
    packageJsonPath,
    tsConfigPath,
  };
}
