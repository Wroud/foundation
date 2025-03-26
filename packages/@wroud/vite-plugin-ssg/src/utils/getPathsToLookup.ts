export function getPathsToLookup(path: string) {
  const parts = path.split("/");
  const lookUpPaths: string[] = [];

  for (let i = parts.length; i >= 0; i--) {
    let pathPart = "/" + parts.slice(0, i).join("/");
    if (pathPart.endsWith("/")) {
      pathPart = pathPart.slice(0, -1);
    }

    lookUpPaths.push(pathPart);
    lookUpPaths.push(pathPart + "/index");
  }

  return lookUpPaths;
}
