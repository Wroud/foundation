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

describe("cli tsconfig", () => {
  it("cli tsconfig", async () => {
    await runCli(["tsconfig"]);

    expect(execa).toHaveBeenCalledWith("yarn", [
      "init",
      "-n",
      "@my-scope/my-pkg",
    ]);

    expect(vol.toJSON()).toMatchSnapshot();
  });
  it("cli tsconfig -t es2020", async () => {
    await runCli(["tsconfig", "-t", "es2020"]);

    expect(execa).toHaveBeenCalledWith("yarn", [
      "init",
      "-n",
      "@my-scope/my-pkg",
    ]);

    expect(vol.toJSON()).toMatchSnapshot();
  });
  it("cli tsconfig my-tsconfig", async () => {
    const tsconfigName = "my-tsconfig";
    await runCli(["tsconfig", "my-tsconfig"]);

    expect(execa).toHaveBeenCalledWith("yarn", ["init", "-n", tsconfigName]);

    expect(vol.toJSON()).toMatchSnapshot();
  });
  it("cli tsconfig @my-scope/my-tsconfig", async () => {
    const tsconfigName = "@my-scope/my-tsconfig";
    await runCli(["tsconfig", tsconfigName]);

    expect(execa).toHaveBeenCalledWith("yarn", ["init", "-n", tsconfigName]);

    expect(vol.toJSON()).toMatchSnapshot();
  });
  it("cli tsconfig my-tsconfig -i", async () => {
    const tsconfigName = "my-tsconfig";

    await runCli(["tsconfig", tsconfigName, "-i"]);

    expect(logFn).toHaveBeenCalledWith("run:", "yarn init -n", tsconfigName);

    expect(execa).not.toHaveBeenCalledWith("yarn", [
      "init",
      "-n",
      tsconfigName,
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
