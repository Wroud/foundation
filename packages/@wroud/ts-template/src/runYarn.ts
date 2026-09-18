import { execa } from "execa";
import { CliError } from "./CliError.js";

export async function runYarn(args: string[]): Promise<void> {
  try {
    await execa("yarn", args);
  } catch (error) {
    throw new CliError(
      error instanceof Error ? error.message : `yarn ${args.join(" ")} failed`,
    );
  }
}
