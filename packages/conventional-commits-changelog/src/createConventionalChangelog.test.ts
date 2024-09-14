import { describe, expect, it } from "vitest";
import { createConventionalChangelog } from "./createConventionalChangelog.js";
import type { IConventionalCommit } from "@wroud/conventional-commits-parser";
import { readFile } from "fs/promises";
import path from "path";

describe("createConventionalChangelog", () => {
  it("default", async () => {
    const changelog: string[] = [];

    const commits: IConventionalCommit[] = JSON.parse(
      await readFile(
        path.join(
          import.meta.dirname,
          "../__fixtures__",
          "fixture.conventional-commits.json",
        ),
        "utf-8",
      ),
    );

    for await (const line of createConventionalChangelog(commits)) {
      changelog.push(line);
    }

    expect(changelog).toMatchSnapshot();
  });
});
