import type { Commit } from "conventional-commits-parser";
import type { Options } from "conventional-changelog-core";
import { semverRegex } from "./semverRegex.js";

export function transform<T extends Commit = Commit>(
  prefix: string,
  chunk: Commit,
  cb: Options.Transform.Callback<T>,
) {
  chunk = { ...chunk };

  const gitTags = chunk["gitTags"];
  if (typeof gitTags === "string") {
    const tag = /tag:\s([^,)]+)/gi.exec(gitTags)?.[1];

    if (tag) {
      chunk["tag"] = tag;
      chunk["version"] = (tag.match(semverRegex(prefix)) || [])[0];
    }
  }

  if (chunk["committerDate"]) {
    // Format the date using toISOString and extract the date part in 'yyyy-mm-dd' format
    chunk["committerDate"] = new Date(chunk["committerDate"])
      .toISOString()
      .split("T")[0];
  }

  cb(null, chunk as T);
}
