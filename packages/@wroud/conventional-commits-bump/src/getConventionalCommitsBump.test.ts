import { describe, expect, it } from "vitest";
import { getConventionalCommitsBump } from "./getConventionalCommitsBump.js";
import type { IConventionalCommit } from "@wroud/conventional-commits-parser";

describe("getConventionalCommitsBump", () => {
  it("major", () => {
    const commits: IConventionalCommit[] = [
      {
        breakingChanges: ["breaking"],
        type: "fix",
      } as IConventionalCommit,
    ];

    expect(getConventionalCommitsBump(commits)).toBe("major");
  });

  it("minor", () => {
    const commits: IConventionalCommit[] = [
      {
        breakingChanges: [] as string[],
        type: "feat",
      } as IConventionalCommit,
    ];

    expect(getConventionalCommitsBump(commits)).toBe("minor");
  });

  it("patch", () => {
    const commits: IConventionalCommit[] = [
      {
        breakingChanges: [] as string[],
        type: "fix",
      } as IConventionalCommit,
    ];

    expect(getConventionalCommitsBump(commits)).toBe("patch");
  });

  it("null", () => {
    const commits: IConventionalCommit[] = [
      {
        breakingChanges: [] as string[],
        type: "chore",
      } as IConventionalCommit,
    ];

    expect(getConventionalCommitsBump(commits)).toBe(null);
  });

  it("multiple", () => {
    const commits: IConventionalCommit[] = [
      {
        breakingChanges: [] as string[],
        type: "feat",
      } as IConventionalCommit,
      {
        breakingChanges: [] as string[],
        type: "fix",
      } as IConventionalCommit,
    ];

    expect(getConventionalCommitsBump(commits)).toBe("minor");
  });

  it("multiple 2", () => {
    const commits: IConventionalCommit[] = [
      {
        breakingChanges: [] as string[],
        type: "fix",
      } as IConventionalCommit,
      {
        breakingChanges: [] as string[],
        type: "feat",
      } as IConventionalCommit,
    ];

    expect(getConventionalCommitsBump(commits)).toBe("minor");
  });
});
