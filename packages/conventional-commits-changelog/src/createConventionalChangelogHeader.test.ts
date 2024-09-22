import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createConventionalChangelogHeader } from "./createConventionalChangelogHeader.js";

describe("createConventionalChangelogHeader", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2000, 1, 23, 12, 34, 56));
  });

  afterEach(() => {
    vi.useRealTimers();
  });
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
