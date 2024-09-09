import * as gitSemverTags from "git-semver-tags";

declare module "git-semver-tags" {
  const p = gitSemverTags.default;
  export { p as getSemverTags };
}
