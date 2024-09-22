export const GithubURL = {
  issue: (repository: string, issue: number) =>
    `https://github.com/${repository}/issues/${issue}`,
  commit: (repository: string, hash: string) =>
    `https://github.com/${repository}/commit/${hash}`,
};
