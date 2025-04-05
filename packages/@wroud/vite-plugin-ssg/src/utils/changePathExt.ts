export function changePathExt(path: string, ext: string) {
  const [pathPart, queryPart] = path.split("?") as [string, string | undefined];
  const queryString = queryPart ? `?${queryPart}` : "";
  const lastDotIndex = pathPart.lastIndexOf(".");

  // If no dot found or dot is at the beginning (like in .env), treat as no extension
  if (lastDotIndex <= 0) {
    return pathPart + ext + queryString;
  }

  // Remove existing extension and add new one
  const basename = pathPart.substring(0, lastDotIndex);
  return basename + ext + queryString;
}
