import { execa } from "execa";

/**
 * Validates that Git is installed and the current directory is a Git repository.
 */
export async function validateGitEnvironment() {
  try {
    // Check if Git is installed
    await execa`git --version`;
  } catch {
    throw new Error("Git is not installed or not found in PATH.");
  }

  try {
    // Check if the current directory is a Git repository
    await execa`git rev-parse --is-inside-work-tree`;
  } catch {
    throw new Error("The current directory is not a Git repository.");
  }
}
