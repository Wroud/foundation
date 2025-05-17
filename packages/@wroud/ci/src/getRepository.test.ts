import { describe, it, expect, afterEach, vi, beforeEach } from "vitest";
import { fs, vol } from "memfs";
import path from "path";
import { getRepository } from "./config.js";

vi.mock("fs", () => fs);
vi.mock("fs/promises", () => fs.promises);

let configMock = {};

vi.doMock("/project/wroud.ci.config.js", () => {
  return {
    get default() {
      return configMock;
    },
  };
});

const CWD = path.normalize("/project");
let cwdSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vol.reset();
  cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(CWD);
  vi.resetModules();
});

afterEach(() => {
  vol.reset();
  cwdSpy.mockRestore();
  delete process.env["GITHUB_REPOSITORY"];
  vi.resetModules();
  vi.clearAllMocks();
  configMock = {};
});

describe.sequential("getRepository", () => {
  it("from env", async () => {
    process.env["GITHUB_REPOSITORY"] = "owner/env";
    expect(await getRepository()).toBe("owner/env");
  });

  it("from config", async () => {
    configMock = { repository: "owner/config" };
    expect(await getRepository()).toBe("owner/config");
  });

  it("from package.json", async () => {
    vol.fromJSON(
      {
        "package.json": JSON.stringify({
          repository: { url: "https://github.com/owner/pkg" },
        }),
      },
      CWD,
    );

    console.log("try");
    expect(await getRepository()).toBe("owner/pkg");
  });
});
