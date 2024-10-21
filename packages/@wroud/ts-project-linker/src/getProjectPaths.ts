import { join, resolve } from "path";

export interface IProjectPaths {
  directory: string;
  packageJsonPath: string;
  tsConfigPatterns: string[];
}

export function getProjectPaths(path: string): IProjectPaths {
  let packageJsonPath = path;
  let tsConfigPatterns = [path];

  if (path.endsWith(".json")) {
    tsConfigPatterns = [path];
    packageJsonPath = join(path, "..", "package.json");
    path = join(path, "..");
  } else {
    tsConfigPatterns = [
      join(path, "tsconfig.json"),
      join(path, "tsconfig.*.json"),
    ];
    packageJsonPath = join(path, "package.json");
  }

  return {
    directory: resolve(path),
    packageJsonPath,
    tsConfigPatterns,
  };
}
