import "./tests/mockExeca.js";
import { describe, expect, it, vi } from "vitest";
import { getGitCommits } from "./getGitCommits.js";
import { createReadStream } from "fs";
import { createInterface } from "readline/promises";
import path from "path";
import type { IGitCommitInfo } from "./IGitCommitInfo.js";
import { execa } from "execa";
import { mockExecaGitChecks } from "./tests/mockExecaGitChecks.js";

vi.mock(import("uuid"), () => ({
  v4: () => "end" as any,
}));

function execaMock(fixturePath: string) {
  return async function* (cmd: string, ...args: string[]) {
    const gitMock = mockExecaGitChecks(
      { mockVersion: true, mockWorkTree: true },
      cmd,
      ...args,
    );

    if (gitMock !== null) {
      yield gitMock;
      return;
    }

    let fixture = path.join(
      import.meta.dirname,
      "../__testfixtures__",
      fixturePath,
    );

    const fileStream = createReadStream(fixture);

    const rl = createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      yield line;
    }
  };
}

describe("getGitCommits", () => {
  it("without arguments", async () => {
    if (vi.isMockFunction(execa)) {
      execa.mockImplementation(execaMock("fixture.git-log.txt"));
    }

    const commits: IGitCommitInfo[] = [];
    for await (const commit of getGitCommits()) {
      commits.push(commit);
    }

    expect(commits).toMatchSnapshot();
  });
  it("with custom trailer", async () => {
    if (vi.isMockFunction(execa)) {
      execa.mockImplementation(execaMock("fixture.git-log.txt"));
    }

    const commits: IGitCommitInfo[] = [];
    for await (const commit of getGitCommits({
      customTrailers: [/^(?<token>BREAKING CHANGE):[\s\t]*(?<value>.+)$/],
    })) {
      commits.push(commit);
    }

    expect(commits).toMatchSnapshot();
  });
  it("with path", async () => {
    if (vi.isMockFunction(execa)) {
      execa.mockImplementation(execaMock("fixture.git-log-path.txt"));
    }

    const commits = [];
    for await (const commit of getGitCommits({ path: "." })) {
      commits.push(commit);
    }
    expect(commits).toMatchSnapshot();
  });
});
