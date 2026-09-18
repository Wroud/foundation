import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from "vitest";
import { fs, vol } from "memfs";
import { execa } from "execa";
import path from "path";
import { stripVTControlCharacters } from "util";
import { confirm, isInteractive } from "./confirm.js";

vi.mock("fs", () => fs);
vi.mock("fs/promises", () => fs.promises);

vi.mock("execa", () => ({
  execa: vi.fn(),
}));

vi.mock("./confirm.js", () => ({
  isInteractive: vi.fn(),
  confirm: vi.fn(),
}));

let originalArgv: string[];
let logFn: MockInstance<Console["log"]>;
let warnFn: MockInstance<Console["warn"]>;
let errorFn: MockInstance<Console["error"]>;
let cwdFn: MockInstance<typeof process.cwd>;

const ROOT = path.normalize("/repo");
const PACKAGE = path.join(ROOT, "packages/@my-scope/my-pkg");

const rootManifest = JSON.stringify({
  name: "repo",
  private: true,
  workspaces: { packages: ["packages/*", "packages/@my-scope/*"] },
  devDependencies: { "@wroud/ts-template": "^0" },
});

const existingManifest = JSON.stringify({
  name: "@my-scope/my-pkg",
  description: "keep me",
  scripts: { build: "tsc -b", clear: "rimraf lib" },
  dependencies: { tslib: "^2" },
});

beforeEach(() => {
  originalArgv = process.argv;
  vol.reset();

  logFn = vi.spyOn(console, "log").mockImplementation(() => {});
  warnFn = vi.spyOn(console, "warn").mockImplementation(() => {});
  errorFn = vi.spyOn(console, "error").mockImplementation(() => {});
  cwdFn = vi.spyOn(process, "cwd");
});

afterEach(() => {
  process.argv = originalArgv;
  process.exitCode = undefined;
  vi.resetModules();
  vi.resetAllMocks();
  logFn.mockRestore();
  warnFn.mockRestore();
  errorFn.mockRestore();
  cwdFn.mockRestore();
});

describe("workspace root", () => {
  it("refuses to scaffold a workspace root even with --force", async () => {
    vol.fromJSON({ [path.join(ROOT, "package.json")]: rootManifest });
    const before = vol.toJSON();

    await runCli(ROOT, [
      "project",
      "@my-scope/new-pkg",
      "--ts",
      "@my-scope/tsconfig",
      "--force",
    ]);

    expect(execa).not.toHaveBeenCalled();
    expect(vol.toJSON()).toEqual(before);
    expect(process.exitCode).toBe(1);
    expect(errorOutput()).toMatchSnapshot();
  });

  it("refuses to create a base tsconfig in a workspace root", async () => {
    vol.fromJSON({ [path.join(ROOT, "package.json")]: rootManifest });
    const before = vol.toJSON();

    await runCli(ROOT, ["tsconfig", "tsconfig"]);

    expect(execa).not.toHaveBeenCalled();
    expect(vol.toJSON()).toEqual(before);
    expect(process.exitCode).toBe(1);
    expect(errorOutput()).toMatchSnapshot();
  });

  it("refuses during a dry run too", async () => {
    vol.fromJSON({ [path.join(ROOT, "package.json")]: rootManifest });

    await runCli(ROOT, ["project", "-i"]);

    expect(process.exitCode).toBe(1);
    expect(errorOutput()).toContain("workspace root");
  });
});

describe("workspace membership", () => {
  it("refuses a scope folder", async () => {
    const scope = path.join(ROOT, "packages/@my-scope");
    vol.fromJSON({ [path.join(ROOT, "package.json")]: rootManifest });
    vol.mkdirSync(scope, { recursive: true });
    const before = vol.toJSON();

    await runCli(scope, ["project", "@my-scope/new-pkg", "--ts", "tsconfig"]);

    expect(execa).not.toHaveBeenCalled();
    expect(vol.toJSON()).toEqual(before);
    expect(process.exitCode).toBe(1);
    expect(errorOutput()).toMatchSnapshot();
  });

  it("refuses a folder that none of the workspace globs match", async () => {
    const outside = path.join(ROOT, "tools/new-pkg");
    vol.fromJSON({ [path.join(ROOT, "package.json")]: rootManifest });
    vol.mkdirSync(outside, { recursive: true });
    const before = vol.toJSON();

    await runCli(outside, ["project", "@my-scope/new-pkg"]);

    expect(execa).not.toHaveBeenCalled();
    expect(vol.toJSON()).toEqual(before);
    expect(process.exitCode).toBe(1);
    expect(errorOutput()).toMatchSnapshot();
  });

  it("scaffolds a new folder matched by the workspace globs", async () => {
    vol.fromJSON({ [path.join(ROOT, "package.json")]: rootManifest });
    vol.mkdirSync(PACKAGE, { recursive: true });
    mockYarnInit(PACKAGE);

    await runCli(PACKAGE, ["project"]);

    expect(execa).toHaveBeenCalledWith("yarn", [
      "init",
      "-n",
      "@my-scope/my-pkg",
    ]);
    expect(process.exitCode).toBeUndefined();
    expect(errorFn).not.toHaveBeenCalled();
  });

  it("honours negated workspace globs", async () => {
    const excluded = path.join(ROOT, "packages/excluded");
    vol.fromJSON({
      [path.join(ROOT, "package.json")]: JSON.stringify({
        name: "repo",
        workspaces: ["packages/*", "!packages/excluded"],
      }),
    });
    vol.mkdirSync(excluded, { recursive: true });

    await runCli(excluded, ["project"]);

    expect(execa).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
    expect(errorOutput()).toContain("mkdir -p <package-folder>");
  });
});

describe("existing files", () => {
  beforeEach(() => {
    vol.fromJSON({
      [path.join(ROOT, "package.json")]: rootManifest,
      [path.join(PACKAGE, "package.json")]: existingManifest,
      [path.join(PACKAGE, "src/index.ts")]: "export {};\n",
    });
  });

  it("stops without --force when not attached to a terminal", async () => {
    const before = vol.toJSON();

    await runCli(PACKAGE, ["project"]);

    expect(execa).not.toHaveBeenCalled();
    expect(confirm).not.toHaveBeenCalled();
    expect(vol.toJSON()).toEqual(before);
    expect(process.exitCode).toBe(1);
    expect(errorOutput()).toMatchSnapshot();
  });

  it("updates the existing package.json in place with --force", async () => {
    await runCli(PACKAGE, ["project", "--force"]);

    expect(execa).toHaveBeenCalledTimes(1);
    expect(execa).toHaveBeenCalledWith("yarn", [
      "add",
      "-D",
      "@my-scope/tsconfig",
      "typescript",
      "rimraf",
    ]);
    expect(process.exitCode).toBeUndefined();
    expect(vol.toJSON(PACKAGE)).toMatchSnapshot();
  });

  it("asks for confirmation in a terminal and continues on yes", async () => {
    vi.mocked(isInteractive).mockReturnValue(true);
    vi.mocked(confirm).mockResolvedValue(true);

    await runCli(PACKAGE, ["project"]);

    expect(confirm).toHaveBeenCalledOnce();
    expect(execa).not.toHaveBeenCalledWith("yarn", [
      "init",
      "-n",
      "@my-scope/my-pkg",
    ]);
    expect(process.exitCode).toBeUndefined();
    expect(
      JSON.parse(
        vol.readFileSync(path.join(PACKAGE, "package.json"), "utf-8") as string,
      ),
    ).toMatchObject({ description: "keep me", dependencies: { tslib: "^2" } });
  });

  it("asks for confirmation in a terminal and aborts on no", async () => {
    vi.mocked(isInteractive).mockReturnValue(true);
    vi.mocked(confirm).mockResolvedValue(false);
    const before = vol.toJSON();

    await runCli(PACKAGE, ["project"]);

    expect(execa).not.toHaveBeenCalled();
    expect(vol.toJSON()).toEqual(before);
    expect(process.exitCode).toBe(1);
    expect(errorOutput()).toBe("Aborted, nothing was changed.");
  });

  it("only reports what would happen during a dry run", async () => {
    const before = vol.toJSON();

    await runCli(PACKAGE, ["project", "-i"]);

    expect(execa).not.toHaveBeenCalled();
    expect(confirm).not.toHaveBeenCalled();
    expect(vol.toJSON()).toEqual(before);
    expect(process.exitCode).toBeUndefined();
    expect(warnFn).toHaveBeenCalledOnce();
  });

  it("guards an existing tsconfig.json on its own", async () => {
    vol.reset();
    vol.fromJSON({
      [path.join(PACKAGE, "tsconfig.json")]: "{}",
    });

    await runCli(PACKAGE, ["tsconfig"]);

    expect(execa).not.toHaveBeenCalled();
    expect(vol.readFileSync(path.join(PACKAGE, "tsconfig.json"), "utf-8")).toBe(
      "{}",
    );
    expect(process.exitCode).toBe(1);
    expect(errorOutput()).toContain("already contains tsconfig.json");
  });

  it("renames an existing package with tsconfig --force instead of wiping it", async () => {
    await runCli(PACKAGE, ["tsconfig", "@my-scope/tsconfig", "--force"]);

    expect(execa).not.toHaveBeenCalled();
    expect(
      JSON.parse(
        vol.readFileSync(path.join(PACKAGE, "package.json"), "utf-8") as string,
      ),
    ).toEqual({ ...JSON.parse(existingManifest), name: "@my-scope/tsconfig" });
  });
});

describe("yarn failures", () => {
  it("reports the failed command without a stack trace", async () => {
    vol.mkdirSync(PACKAGE, { recursive: true });
    vi.mocked(execa).mockRejectedValueOnce(
      new Error(
        "Command failed with exit code 1: yarn init -n @my-scope/my-pkg",
      ),
    );

    await runCli(PACKAGE, ["project"]);

    expect(process.exitCode).toBe(1);
    expect(errorOutput()).toBe(
      "Command failed with exit code 1: yarn init -n @my-scope/my-pkg",
    );
  });
});

async function runCli(cwd: string, args: string[]) {
  cwdFn.mockReturnValue(cwd);
  process.argv = ["node", "ts-template", ...args];
  await import("./cli.js");
}

function mockYarnInit(cwd: string) {
  vi.mocked(execa).mockImplementation((async (
    _command: string,
    [cmd, , name]: string[],
  ) => {
    if (cmd === "init") {
      await fs.promises.writeFile(
        path.join(cwd, "package.json"),
        JSON.stringify({ name }),
      );
    }
  }) as never);
}

function errorOutput() {
  return stripVTControlCharacters(errorFn.mock.calls.flat().join("\n"));
}
