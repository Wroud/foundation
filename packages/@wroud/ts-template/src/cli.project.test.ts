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
import { getTsWithVersion } from "./getTsWithVersion.js";
import path from "path";

vi.mock("fs", () => fs);
vi.mock("fs/promises", () => fs.promises);

vi.mock("execa", () => ({
  execa: vi.fn(),
}));

let originalArgv: string[];
let logFn: MockInstance<Console["log"]>;
let warnFn: MockInstance<Console["warn"]>;
let errorFn: MockInstance<Console["error"]>;
let cwdFn: MockInstance<typeof process.cwd>;
const CWD = path.normalize("/project/packages/@my-scope/my-pkg");

beforeEach(() => {
  originalArgv = process.argv;
  vol.reset();
  vol.mkdirSync(CWD, { recursive: true });

  logFn = vi.spyOn(console, "log").mockImplementation(() => {});
  warnFn = vi.spyOn(console, "warn").mockImplementation(() => {});
  errorFn = vi.spyOn(console, "error").mockImplementation(() => {});
  cwdFn = vi.spyOn(process, "cwd").mockReturnValue(CWD);
});

afterEach(() => {
  process.argv = originalArgv;
  vi.resetModules();
  vi.resetAllMocks();
  logFn.mockRestore();
  warnFn.mockRestore();
  errorFn.mockRestore();
  cwdFn.mockRestore();
});

describe("cli project", () => {
  it("cli project", async () => {
    await runCli(["project"]);

    expect(execa).toHaveBeenCalledWith("yarn", [
      "init",
      "-n",
      "@my-scope/my-pkg",
    ]);
    expect(execa).toHaveBeenCalledWith("yarn", [
      "add",
      "-D",
      "@my-scope/tsconfig",
      getTsWithVersion(),
    ]);

    expect(vol.toJSON()).toMatchSnapshot();
  });
  it("cli project -t es2020", async () => {
    await runCli(["project", "-t", "es2020"]);

    expect(execa).toHaveBeenCalledWith("yarn", [
      "init",
      "-n",
      "@my-scope/my-pkg",
    ]);
    expect(execa).toHaveBeenCalledWith("yarn", [
      "add",
      "-D",
      "@my-scope/tsconfig",
      getTsWithVersion(),
    ]);

    expect(vol.toJSON()).toMatchSnapshot();
  });
  it("cli project my-project", async () => {
    const projectName = "my-project";
    await runCli(["project", "my-project"]);

    expect(execa).toHaveBeenCalledWith("yarn", ["init", "-n", projectName]);
    expect(execa).toHaveBeenCalledWith("yarn", [
      "add",
      "-D",
      "tsconfig",
      getTsWithVersion(),
    ]);

    expect(vol.toJSON()).toMatchSnapshot();
  });
  it("cli project @my-scope/my-project", async () => {
    const projectName = "@my-scope/my-project";
    await runCli(["project", projectName]);

    expect(execa).toHaveBeenCalledWith("yarn", ["init", "-n", projectName]);
    expect(execa).toHaveBeenCalledWith("yarn", [
      "add",
      "-D",
      "@my-scope/tsconfig",
      getTsWithVersion(),
    ]);

    expect(vol.toJSON()).toMatchSnapshot();
  });
  it("cli project my-project --ts my-tsconfig", async () => {
    const projectName = "my-project";
    const tsConfigName = "my-tsconfig";
    await runCli(["project", projectName, "--ts", tsConfigName]);

    expect(execa).toHaveBeenCalledWith("yarn", ["init", "-n", projectName]);
    expect(execa).toHaveBeenCalledWith("yarn", [
      "add",
      "-D",
      tsConfigName,
      getTsWithVersion(),
    ]);

    expect(vol.toJSON()).toMatchSnapshot();
  });
  it("cli project @my-scope/my-project --ts my-tsconfig", async () => {
    const projectName = "@my-scope/my-project";
    const tsConfigName = "@my-scope/my-tsconfig";
    await runCli(["project", projectName, "--ts", tsConfigName]);

    expect(execa).toHaveBeenCalledWith("yarn", ["init", "-n", projectName]);
    expect(execa).toHaveBeenCalledWith("yarn", [
      "add",
      "-D",
      tsConfigName,
      getTsWithVersion(),
    ]);

    expect(vol.toJSON()).toMatchSnapshot();
  });
  it("cli project @my-scope/my-project --ts @other-scope/my-tsconfig", async () => {
    const projectName = "@my-scope/my-project";
    const tsConfigName = "@other-scope/my-tsconfig";
    await runCli(["project", projectName, "--ts", tsConfigName]);

    expect(execa).toHaveBeenCalledWith("yarn", ["init", "-n", projectName]);
    expect(execa).toHaveBeenCalledWith("yarn", [
      "add",
      "-D",
      tsConfigName,
      getTsWithVersion(),
    ]);

    expect(vol.toJSON()).toMatchSnapshot();
  });
  it("cli project my-project --ts my-tsconfi -i", async () => {
    const projectName = "my-project";
    const tsConfigName = "my-tsconfig";

    await runCli(["project", projectName, "--ts", tsConfigName, "-i"]);

    expect(logFn).toHaveBeenCalledWith("run:", "yarn init -n", projectName);
    expect(logFn).toHaveBeenCalledWith(
      "run:",
      "yarn add -D",
      tsConfigName,
      getTsWithVersion(),
    );

    expect(execa).not.toHaveBeenCalledWith("yarn", ["init", "-n", projectName]);
    expect(execa).not.toHaveBeenCalledWith("yarn", [
      "add",
      "-D",
      tsConfigName,
      getTsWithVersion(),
    ]);

    expect(vol.toJSON()).toMatchSnapshot();
    expect(logFn).toHaveBeenCalledWith(
      "writeFile:",
      expect.any(String),
      expect.any(String),
    );

    expect(warnFn).not.toHaveBeenCalled();
    expect(errorFn).not.toHaveBeenCalled();
  });
});

async function runCli(args: string[]) {
  process.argv = ["node", "ts-template", ...args];
  await import("./cli.js");
}
