import "./tests/mockExeca.js";
import { execa } from "execa";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { getGitLastSemverTag } from "./getGitLastSemverTag.js";
import { mockExecaGitChecks } from "./tests/mockExecaGitChecks.js";

async function* execaMock(cmd: string, args: string[]) {
  const gitMock = mockExecaGitChecks(
    { mockVersion: true, mockWorkTree: true },
    cmd,
    ...(args || []),
  );

  if (gitMock !== null) {
    yield gitMock;
  }

  if (args[2] === "n*") {
    throw new Error("fatal: No names found, cannot describe anything.");
  }

  if (args[2] === "s*") {
    yield "sdv1.0.0";
    yield "sdv";
    yield "sdvsdd";
    yield "s1.0.0";
  }

  if (args[2] === "di-v*") {
    yield "di-v1.0.0";
  }

  yield "v1.0.0";
}

describe("getLastSemverTag", () => {
  beforeAll(() => {
    if (vi.isMockFunction(execa)) {
      execa.mockImplementation(execaMock);
    }
  });
  afterAll(() => {
    vi.resetAllMocks();
  });
  it("without arguments", async () => {
    expect(await getGitLastSemverTag()).toBe("v1.0.0");
  });
  it("without path", async () => {
    expect(await getGitLastSemverTag({ prefix: "di-v" })).toBe("di-v1.0.0");
  });
  it("should return the last semver tag", async () => {
    expect(await getGitLastSemverTag({ prefix: "s" })).toBe("s1.0.0");
  });
  it("should return null if no semver tag is found", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await getGitLastSemverTag({ prefix: "n" })).toBe(null);
  });
});
