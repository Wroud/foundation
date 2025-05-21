import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { fs, vol } from "memfs";
import path from "path";
import { execa } from "execa";

vi.mock("fs", () => fs);
vi.mock("fs/promises", () => fs.promises);
vi.mock("execa", () => ({ execa: vi.fn() }));

const CWD = path.normalize("/project");
let cwdSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vol.reset();
  cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(CWD);
});

afterEach(() => {
  vol.reset();
  cwdSpy.mockRestore();
  delete process.env["npm_config_user_agent"];
  vi.resetModules();
  vi.clearAllMocks();
});

describe.sequential("bumpPackageVersion", () => {
  it("yarn", async () => {
    vol.fromJSON({
      "package.json": JSON.stringify({ name: "pkg", version: "1.0.0" })
    }, CWD);
    process.env["npm_config_user_agent"] = "yarn/4.0.0";

    const { bumpPackageVersion } = await import("./packageManager.js");

    if (vi.isMockFunction(execa)) {
      execa.mockImplementationOnce(async () => {
        const pkgPath = path.join(CWD, "package.json");
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8").toString());
        pkg.version = "1.0.1";
        fs.writeFileSync(pkgPath, JSON.stringify(pkg));
      });
    }

    const version = await bumpPackageVersion("patch");

    expect(execa).toHaveBeenCalledWith("yarn", ["version", "patch"], { stdout: "inherit" });
    expect(version).toBe("1.0.1");
  });

  it("npm", async () => {
    vol.fromJSON({
      "package.json": JSON.stringify({ name: "pkg", version: "1.0.0" })
    }, CWD);
    process.env["npm_config_user_agent"] = "npm/9.0.0";

    const { bumpPackageVersion } = await import("./packageManager.js");

    if (vi.isMockFunction(execa)) {
      execa.mockImplementationOnce(async () => {
        const pkgPath = path.join(CWD, "package.json");
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8").toString());
        pkg.version = "1.0.1";
        fs.writeFileSync(pkgPath, JSON.stringify(pkg));
      });
    }

    const version = await bumpPackageVersion("patch");

    expect(execa).toHaveBeenCalledWith("npm", ["version", "patch"], { stdout: "inherit" });
    expect(version).toBe("1.0.1");
  });

  it("pnpm", async () => {
    vol.fromJSON({
      "package.json": JSON.stringify({ name: "pkg", version: "1.0.0" })
    }, CWD);
    process.env["npm_config_user_agent"] = "pnpm/8.0.0";

    const { bumpPackageVersion } = await import("./packageManager.js");

    const version = await bumpPackageVersion("patch");

    expect(execa).not.toHaveBeenCalled();
    expect(version).toBe("1.0.1");
  });

  it("config", async () => {
    vi.doMock("./config.js", () => ({ getPackageManager: () => Promise.resolve("npm") }));

    const { detectPackageManager } = await import("./packageManager.js");

    const pm = await detectPackageManager();

    expect(pm).toBe("npm");
  });
});
