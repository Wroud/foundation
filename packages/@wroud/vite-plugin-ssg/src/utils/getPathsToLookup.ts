export function* getPathsToLookup(path: string) {
  const parts = path.split("/");

  for (let i = parts.length; i >= 0; i--) {
    let pathPart = parts.slice(0, i).join("/");
    if (pathPart.endsWith("/")) {
      pathPart = pathPart.slice(0, -1);
    }

    if (pathPart && pathPart !== ".") {
      yield pathPart;
      yield pathPart + "/index";
    } else {
      yield pathPart + "/index";
      break;
    }
  }
}
