/**
 * Strips "index" segment from a path, normalizing to directory form.
 * - `"index"` → `""`
 * - `"/index"` → `"/"`
 * - `"foo/index"` → `"foo/"`
 * - `"foo/bar"` → `"foo/bar"` (unchanged)
 */
export function stripIndexFromPath(path: string): string {
  return path.replace(/(^|\/)index$/, "$1");
}
