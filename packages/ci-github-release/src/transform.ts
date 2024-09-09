import type { Commit } from "conventional-commits-parser";
import type { Options } from "conventional-changelog-core";
import semverRegex from "semver-regex";

export function transform<T extends Commit = Commit>(
  chunk: Commit,
  cb: Options.Transform.Callback<T>,
) {
  chunk = { ...chunk };

  const gitTags = chunk["gitTags"];
  if (typeof gitTags === "string") {
    chunk["version"] = (gitTags.match(semverRegex()) || [])[0];
  }

  if (chunk["committerDate"]) {
    // Format the date using toISOString and extract the date part in 'yyyy-mm-dd' format
    chunk["committerDate"] = new Date(chunk["committerDate"])
      .toISOString()
      .split("T")[0];
  }

  cb(null, chunk as T);
}
