import { describe, it, expect, afterEach } from "vitest";
import { writeFile } from "fs/promises";
import { temporaryDirectory } from "tempy";
import path from "path";
import { getRepository } from "./config.js";

const cwd = process.cwd();

afterEach(() => {
  process.chdir(cwd);
  delete process.env["GITHUB_REPOSITORY"];
});

describe("getRepository", () => {
  it("from env", async () => {
    process.env["GITHUB_REPOSITORY"] = "owner/env";
    expect(await getRepository()).toBe("owner/env");
  });

  it("from config", async () => {
    const dir = temporaryDirectory();
    await writeFile(
      path.join(dir, "wroud.ci.config.js"),
      "export default { repository: 'owner/config' };",
    );
    process.chdir(dir);

    expect(await getRepository()).toBe("owner/config");
  });

  it("from package.json", async () => {
    const dir = temporaryDirectory();
    await writeFile(
      path.join(dir, "package.json"),
      JSON.stringify({ repository: { url: "https://github.com/owner/pkg" } }),
    );
    process.chdir(dir);

    expect(await getRepository()).toBe("owner/pkg");
  });
});
