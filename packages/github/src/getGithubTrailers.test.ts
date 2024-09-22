import { describe, expect, it } from "vitest";
import { getGithubTrailers } from "./getGithubTrailers.js";

describe("getGithubTrailers", () => {
  it("empty", async () => {
    const trailers = getGithubTrailers({
      authorEmail: "",
      authorName: "",
      body: "",
      hash: "",
      subject: "",
      tags: [],
      links: {},
      trailers: [],
    });

    expect(trailers.coAuthors).toMatchSnapshot();
  });
  it("lowercase ", async () => {
    const trailers = getGithubTrailers({
      authorEmail: "",
      authorName: "",
      body: "",
      hash: "",
      subject: "",
      tags: [],
      links: {},
      trailers: [{ token: "co-authored-by", value: "name <email>" }],
    });

    expect(trailers.coAuthors).toMatchSnapshot();
  });
  it("missing name", async () => {
    const trailers = getGithubTrailers({
      authorEmail: "",
      authorName: "",
      body: "",
      hash: "",
      subject: "",
      tags: [],
      links: {},
      trailers: [{ token: "Co-authored-by", value: "<email>" }],
    });

    expect(trailers.coAuthors).toMatchSnapshot();
  });
  it("missing email", async () => {
    const trailers = getGithubTrailers({
      authorEmail: "",
      authorName: "",
      body: "",
      hash: "",
      subject: "",
      tags: [],
      links: {},
      trailers: [{ token: "Co-authored-by", value: "name" }],
    });

    expect(trailers.coAuthors).toMatchSnapshot();
  });
  it("missing name and email", async () => {
    const trailers = getGithubTrailers({
      authorEmail: "",
      authorName: "",
      body: "",
      hash: "",
      subject: "",
      tags: [],
      links: {},
      trailers: [{ token: "Co-authored-by", value: "" }],
    });

    expect(trailers.coAuthors).toMatchSnapshot();
  });
  it("multiple", async () => {
    const trailers = getGithubTrailers({
      authorEmail: "",
      authorName: "",
      body: "",
      hash: "",
      subject: "",
      tags: [],
      links: {},
      trailers: [
        { token: "Co-authored-by", value: "name1 <email1>" },
        { token: "Co-authored-by", value: "name2 <email2>" },
      ],
    });

    expect(trailers.coAuthors).toMatchSnapshot();
  });
  it("multiple with other trailers", async () => {
    const trailers = getGithubTrailers({
      authorEmail: "",
      authorName: "",
      body: "",
      hash: "",
      subject: "",
      tags: [],
      links: {},
      trailers: [
        { token: "Co-authored-by", value: "name1 <email1>" },
        { token: "Co-authored-by", value: "name2 <email2>" },
        { token: "BREAKING CHANGE", value: "value" },
        { token: "BREAKING-CHANGE", value: "value" },
        { token: "Refs", value: "value" },
      ],
    });

    expect(trailers.coAuthors).toMatchSnapshot();
  });
});
