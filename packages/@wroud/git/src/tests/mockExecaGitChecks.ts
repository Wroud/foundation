export function mockExecaGitChecks(
  {
    mockVersion,
    mockWorkTree,
  }: {
    mockVersion?: boolean;
    mockWorkTree?: boolean;
  },
  ...args: string[]
): string | null {
  const cmd = args.join(" ");

  if (mockVersion && cmd === "git --version") {
    return "git version 2.33.0";
  }

  if (mockWorkTree && cmd === "git rev-parse --is-inside-work-tree") {
    return "";
  }

  return null;
}
