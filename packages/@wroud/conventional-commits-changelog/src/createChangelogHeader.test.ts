import { describe, expect, it } from "vitest";
import { createChangelogHeader } from "./createChangelogHeader.js";

describe("createChangelogHeader", () => {
  it("default", () => {
    const header = Array.from(createChangelogHeader());

    expect(header).toMatchSnapshot();
  });

  it("with custom title", () => {
    const header = Array.from(createChangelogHeader("Release notes"));

    expect(header).toMatchSnapshot();
  });

  it("with custom description", () => {
    const header = Array.from(
      createChangelogHeader("Release notes", "This is a description"),
    );

    expect(header).toMatchSnapshot();
  });
});
