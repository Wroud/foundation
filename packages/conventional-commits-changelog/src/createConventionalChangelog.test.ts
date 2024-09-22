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
  it("with metadata url", async () => {
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

    for await (const line of createConventionalChangelog(commits, {
      getMetadata: async (commit) => ({
        url: `https://example.com/${commit.commitInfo.hash}`,
      }),
    })) {
      changelog.push(line);
    }

    expect(changelog).toMatchSnapshot();
  });
  it("with metadata co-authors", async () => {
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

    for await (const line of createConventionalChangelog(commits, {
      getMetadata: async (commit) => ({
        coAuthors:
          commits[0] === commit
            ? [
                {
                  name: "John Doe",
                },
                {
                  name: "Karl Marx",
                  email: "karl@example.com",
                },
                {
                  name: "Jane Doe",
                  email: "jane@example.com",
                  link: "https://example.com/jane",
                },
                {
                  name: "Jack Doe",
                  username: "jack",
                  usernameLink: "https://example.com/jack",
                },
                {
                  name: "Kevin Doe",
                  email: "kevin@example.com",
                  link: "https://example.com/kevin",
                  username: "kevin",
                  usernameLink: "https://example.com/kevin",
                },
              ]
            : [],
      }),
    })) {
      changelog.push(line);
    }

    expect(changelog).toMatchSnapshot();
  });
  it("with metadata formatter", async () => {
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

    for await (const line of createConventionalChangelog(commits, {
      getMetadata: async (commit) => ({
        formatter(message) {
          return `(${commit.commitInfo.hash}) ${message}`;
        },
      }),
    })) {
      changelog.push(line);
    }

    expect(changelog).toMatchSnapshot();
  });
});
