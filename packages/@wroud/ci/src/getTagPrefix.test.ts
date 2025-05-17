import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { fs, vol } from "memfs";
import path from "path";
import { getTagPrefix } from "./config.js";

vi.mock("fs", () => fs);
vi.mock("fs/promises", () => fs.promises);

const CWD = path.normalize("/project");
let cwdSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vol.reset();
  cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(CWD);
});

afterEach(() => {
  vol.reset();
  cwdSpy.mockRestore();
  delete process.env["TAG_PREFIX"];
  vi.resetModules();
});

describe("getTagPrefix", () => {
  it("from env", async () => {
    process.env["TAG_PREFIX"] = "v";
    expect(await getTagPrefix()).toBe("v");
  });

  it("from config", async () => {
    vol.fromJSON({ "wroud.ci.config.js": "export default { tagPrefix: 'v' };" }, CWD);
    expect(await getTagPrefix()).toBe("v");
  });

  it("from package.json", async () => {
    vol.fromJSON({ "package.json": JSON.stringify({ tagPrefix: "v" }) }, CWD);
    expect(await getTagPrefix()).toBe("v");
  });
});
