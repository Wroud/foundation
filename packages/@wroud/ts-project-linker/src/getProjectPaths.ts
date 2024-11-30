import { posix } from "path";

export interface IProjectPaths {
  directory: string;
  packageJsonPath: string;
  tsConfigPatterns: string[];
}

export function getProjectPaths(path: string): IProjectPaths {
  path = path.replace(/\\/g, "/");
  let packageJsonPath = path;
  let tsConfigPatterns = [path];

  if (path.endsWith(".json")) {
    tsConfigPatterns = [path];
    packageJsonPath = posix.join(path, "..", "package.json");
    path = posix.join(path, "..");
  } else {
    tsConfigPatterns = [
      posix.join(path, "tsconfig.json"),
      posix.join(path, "tsconfig.*.json"),
    ];
    packageJsonPath = posix.join(path, "package.json");
  }

  return {
    directory: posix.resolve(path),
    packageJsonPath,
    tsConfigPatterns,
  };
}
