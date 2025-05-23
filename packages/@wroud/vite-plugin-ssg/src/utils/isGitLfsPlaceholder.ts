/**
 * Checks if content appears to be a Git LFS pointer file.
 * Git LFS pointer files start with "version https://git-lfs.github.com/spec"
 * and should not be inlined as they are placeholders.
 *
 * @param content - The file content to check
 * @returns true if the content appears to be a Git LFS pointer
 */
export function isGitLfsPlaceholder(content: string | Buffer): boolean {
  const text = typeof content === "string" ? content : content.toString("utf8");
  return text.startsWith("version https://git-lfs.github.com/spec");
}
