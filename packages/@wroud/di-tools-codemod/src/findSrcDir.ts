import path from "node:path";

export function findSrcDir(filePath: string): string | null {
  let currentDir = filePath;
  const cwdPath = process.cwd();

  while (
    currentDir !== path.parse(currentDir).root &&
    currentDir !== cwdPath &&
    currentDir !== "."
  ) {
    if (path.basename(currentDir) === "src") {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }

  return null;
}
