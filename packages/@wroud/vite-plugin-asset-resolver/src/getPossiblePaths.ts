import path from "path";
export function* getPossiblePaths(
  importer: string,
  dist: string[],
  src: string[],
) {
  const pathParts = importer.split(path.posix.sep);

  let distIndex = -1;
  for (let i = pathParts.length - 1; i >= 0; i--) {
    if (dist.includes(pathParts[i]!)) {
      distIndex = i;
      break;
    }
  }

  if (distIndex !== -1) {
    for (const srcAlias of src) {
      pathParts[distIndex] = srcAlias;

      let adjustedImporter = path.posix.join(...pathParts);

      if (importer.startsWith("/")) {
        adjustedImporter = "/" + adjustedImporter;
      }

      yield adjustedImporter;
    }
  }
}
