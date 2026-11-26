import { spawn } from "node:child_process";
import { once } from "node:events";
import { describe, expect, it } from "vitest";
import { startNative, type NativeCompiler } from "./native.js";

const stubbornCompiler: NativeCompiler = {
  name: "stubborn",
  version: "7.0.0",
  command: process.execPath,
  args: [
    "-e",
    `for (const s of ["SIGTERM", "SIGINT", "SIGHUP"]) process.on(s, () => {});
     setInterval(() => {}, 1000);
     process.stdout.write("pid " + process.pid + "\\nready\\n");`,
    "--",
  ],
};

function isAlive(pid: number) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function waitForExit(pid: number) {
  for (let i = 0; i < 40 && isAlive(pid); i++) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return !isAlive(pid);
}

describe("startNative", () => {
  it("stops a compiler that ignores SIGTERM and SIGINT", async () => {
    const pid = Promise.withResolvers<number>();
    const runner = startNative(
      stubbornCompiler,
      [],
      true,
      (message) => {
        const match = /pid (\d+)/.exec(message.message);
        if (match) pid.resolve(Number(match[1]));
      },
      () => {},
    );
    const childPid = await pid.promise;

    await runner.stop();

    expect(isAlive(childPid)).toBe(false);
    expect(process.listenerCount("SIGINT")).toBe(0);
    expect(process.listenerCount("exit")).toBe(0);
  });

  it("takes the compiler down when the host is interrupted", async () => {
    const { exit, childPid } = await interruptHost("");

    expect(exit).toEqual({ code: null, signal: "SIGINT" });
    expect(await waitForExit(childPid)).toBe(true);
  });

  it("still exits when the host has a signal-exit style SIGINT listener", async () => {
    const { exit, childPid } = await interruptHost(
      `process.on("SIGINT", function onlyIfLast(signal) {
         if (process.listenerCount("SIGINT") === 1) {
           process.off("SIGINT", onlyIfLast);
           process.kill(process.pid, signal);
         }
       });`,
    );

    expect(exit).toEqual({ code: null, signal: "SIGINT" });
    expect(await waitForExit(childPid)).toBe(true);
  });
});

async function interruptHost(preamble: string) {
  const nativeUrl = new URL("./native.js", import.meta.url).href;
  const host = spawn(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `${preamble}
       const { startNative } = await import(${JSON.stringify(nativeUrl)});
       startNative(${JSON.stringify(stubbornCompiler)}, [], true,
         (m) => console.log(m.message), () => {});`,
    ],
    { stdio: ["ignore", "pipe", "inherit"] },
  );
  const childPid = new Promise<number>((resolve) => {
    let output = "";
    host.stdout.setEncoding("utf8").on("data", (chunk: string) => {
      output += chunk;
      const match = /pid (\d+)/.exec(output);
      if (match) resolve(Number(match[1]));
    });
  });
  const pid = await childPid;
  const exited = once(host, "exit", { signal: AbortSignal.timeout(2000) });

  host.kill("SIGINT");

  const [code, signal] = await exited.catch((error) => {
    host.kill("SIGKILL");
    throw error;
  });
  return { exit: { code, signal }, childPid: pid };
}
