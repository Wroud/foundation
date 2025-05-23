/**
 * Splits a file path into the file part and any postfix query parameters.
 * This mimics Vite's behavior for handling asset URLs with query parameters.
 *
 * @param file - The file path potentially with query parameters
 * @returns A tuple of [file, postfix] where postfix includes the '?' if present
 */
export function splitFileAndPostfix(file: string): [string, string] {
  const queryIndex = file.indexOf("?");
  if (queryIndex >= 0) {
    return [file.slice(0, queryIndex), file.slice(queryIndex)];
  }
  return [file, ""];
}
