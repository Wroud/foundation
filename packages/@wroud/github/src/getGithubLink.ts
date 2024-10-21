import type { IGitLink } from "@wroud/git";
import { GithubURL } from "./GithubURL.js";

export function getGithubLink(
  link: IGitLink,
  repository: string,
): string | null {
  if ("gh" in link) {
    return GithubURL.issue(
      link["repository"] ?? repository,
      parseInt(link.link),
    );
  }

  return null;
}
