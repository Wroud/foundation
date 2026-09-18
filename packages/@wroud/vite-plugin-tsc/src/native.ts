import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createTscOutputParser, type TscMessage } from "./parseTscOutput.js";

export interface NativeCompiler {
  name: string;
  version: string;
  command: string;
  args: string[];
}

interface PackageInfo {
  dir: string;
  version: string;
  bin?: Record<string, string>;
}

function readPackage(name: string): PackageInfo | null {
  try {
    const packageJsonPath = createRequire(import.meta.url).resolve(
      `${name}/package.json`,
    );
    const { version, bin } = JSON.parse(readFileSync(packageJsonPath, "utf8"));
    return { dir: path.dirname(packageJsonPath), version, bin };
  } catch {
    return null;
  }
}

async function resolveCommand(pkg: PackageInfo) {
  try {
    const { default: getExePath } = await import(
      pathToFileURL(path.join(pkg.dir, "lib", "getExePath.js")).href
    );
    return { command: getExePath() as string, args: [] };
  } catch {
    const binPath = Object.values(pkg.bin ?? {})[0];
    return binPath
      ? { command: process.execPath, args: [path.join(pkg.dir, binPath)] }
      : null;
  }
}

export async function resolveNativeCompiler(
  tsgo?: boolean,
): Promise<NativeCompiler | null> {
  const candidates = tsgo
    ? ["@typescript/native-preview", "typescript"]
    : ["typescript"];

  for (const name of candidates) {
    const pkg = readPackage(name);
    if (pkg && Number.parseInt(pkg.version, 10) >= 7) {
      const command = await resolveCommand(pkg);
      if (command) {
        return { name, version: pkg.version, ...command };
      }
    }
  }

  if (tsgo) {
    throw new Error(
      "`tsgo: true` requires `@typescript/native-preview` or `typescript@>=7` to be installed.",
    );
  }

  return null;
}

export function startNative(
  compiler: NativeCompiler,
  tscArgs: string[],
  watch: boolean,
  onMessage: (message: TscMessage) => void,
  onError: (message: string) => void,
) {
  const cwd = process.cwd();
  const parser = createTscOutputParser(cwd, onMessage);
  const args = [
    ...compiler.args,
    ...tscArgs,
    ...(watch ? ["--watch", "--preserveWatchOutput"] : []),
    "--pretty",
    "false",
  ];
  const child = spawn(compiler.command, args, {
    cwd,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const kill = () => child.kill();
  process.once("exit", kill);

  child.stdout.setEncoding("utf8").on("data", parser.write);
  child.stderr.setEncoding("utf8").on("data", onError);

  const exited = new Promise<number>((resolve) => {
    child.once("error", (error) => {
      onError(error.message);
      resolve(1);
    });
    child.once("close", (code) => {
      parser.end();
      resolve(code ?? 1);
    });
  }).finally(() => process.off("exit", kill));

  return {
    exited,
    async stop() {
      child.kill();
      await exited;
    },
  };
}
