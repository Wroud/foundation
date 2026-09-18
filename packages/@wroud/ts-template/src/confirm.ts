import { createInterface } from "readline/promises";

export function isInteractive(): boolean {
  return Boolean(process.stdin.isTTY && process.stdout.isTTY);
}

export async function confirm(question: string): Promise<boolean> {
  const controller = new AbortController();
  const readline = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  readline.on("SIGINT", () => controller.abort());

  try {
    const answer = await readline.question(`${question} [y/N] `, {
      signal: controller.signal,
    });
    return /^y(es)?$/i.test(answer.trim());
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      process.stdout.write("\n");
      return false;
    }
    throw error;
  } finally {
    readline.close();
  }
}
