import type { IGitCommitInfo } from "@wroud/git";
import type { IGithubTrailers } from "./IGithubTrailers.js";
import type { IGithubCoAuthor } from "./IGithubCoAuthor.js";

const coAuthorToken = "Co-authored-by";

interface IGetGithubTrailersOptions {
  loadGithubUserNames?: boolean;
}

export function getGithubTrailers(
  commit: IGitCommitInfo,
  options?: IGetGithubTrailersOptions,
): IGithubTrailers {
  const coAuthors: IGithubCoAuthor[] = [];

  for (const trailer of commit.trailers) {
    switch (trailer.token.toLowerCase()) {
      case coAuthorToken.toLowerCase():
        let [name, email] = trailer.value.split("<");
        name = name?.trim();
        email = email?.slice(0, -1);

        if (!name) {
          continue;
        }

        const coAuthor: IGithubCoAuthor = {
          name,
        };

        if (email && !email.includes("noreply.github.com")) {
          coAuthor.email = email;
        }

        if (options?.loadGithubUserNames) {
        }

        coAuthors.push(coAuthor);
        break;
    }
  }

  return {
    coAuthors,
  };
}
