import { describe, expect, it } from "vitest";
import { parseConventionalCommit } from "./parseConventionalCommit.js";
import { readFile } from "fs/promises";
import path from "path";

describe("parseConventionalCommit", () => {
  it("without", async () => {
    const data = await readFile(
      path.join(
        import.meta.dirname,
        "../__testfixtures__/fixture.git-commits.json",
      ),
      "utf8",
    );
    const commits = JSON.parse(data);
    expect(commits.map(parseConventionalCommit)).toMatchSnapshot();
  });
});
