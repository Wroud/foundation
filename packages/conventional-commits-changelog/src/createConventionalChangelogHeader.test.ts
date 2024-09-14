import { describe, expect, it } from "vitest";
import { createConventionalChangelogHeader } from "./createConventionalChangelogHeader.js";

describe("createConventionalChangelogHeader", () => {
  it("default", () => {
    const header = Array.from(createConventionalChangelogHeader("1.0.0"));

    expect(header).toMatchSnapshot();
  });

  it("with compare URL", () => {
    const header = Array.from(
      createConventionalChangelogHeader("1.0.0", "https://example.com"),
    );

    expect(header).toMatchSnapshot();
  });
});
