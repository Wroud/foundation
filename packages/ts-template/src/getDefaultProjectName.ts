import path from "path";

export function getDefaultProjectName() {
  const normalizedPath = path.normalize(process.cwd()); // Handle cross-platform path differences
  const segments = normalizedPath.split(path.sep).filter(Boolean); // Split and remove empty segments

  const len = segments.length;

  // Check if the second-to-last segment starts with '@'
  if (len > 1 && segments[len - 2]?.startsWith("@")) {
    return `${segments[len - 2]}/${segments[len - 1]}`; // Return last two parts
  }

  // Otherwise, return only the last segment
  return segments[len - 1]!;
}
