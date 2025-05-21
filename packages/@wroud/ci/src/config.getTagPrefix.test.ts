import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { fs, vol } from "memfs";
import path from "path";

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
  delete process.env["TAG_PREFIX"];
  vi.resetModules();
  vi.clearAllMocks();
  configMock = {};
});

describe.sequential("getTagPrefix", () => {
  it("from env", async () => {
    process.env["TAG_PREFIX"] = "v";
    const { getTagPrefix } = await import("./config.js");
    expect(await getTagPrefix()).toBe("v");
  });

  it("from config", async () => {
    configMock = { tagPrefix: "vv" };
    const { getTagPrefix } = await import("./config.js");
    expect(await getTagPrefix()).toBe("vv");
  });

  it("from package.json", async () => {
    vol.fromJSON({ "package.json": JSON.stringify({ tagPrefix: "v" }) }, CWD);
    const { getTagPrefix } = await import("./config.js");
    expect(await getTagPrefix()).toBe("v");
  });
});
