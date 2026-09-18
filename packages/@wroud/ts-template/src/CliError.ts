import picocolors from "picocolors";

export class CliError extends Error {}

export async function reportCliErrors(action: () => Promise<void>) {
  try {
    await action();
  } catch (error) {
    console.error(
      error instanceof CliError ? picocolors.red(error.message) : error,
    );
    process.exitCode = 1;
  }
}
