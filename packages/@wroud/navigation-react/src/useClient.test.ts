import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

const directive = '"use client";';

function read(name: string): string {
  return readFileSync(new URL(name, import.meta.url), "utf8");
}

function runtime(source: string): string {
  return source
    .replace(directive, "")
    .replace(/\/\/# sourceMappingURL=.*$/m, "")
    .trim();
}

function collect(name: string, seen: Set<string>): Set<string> {
  if (seen.has(name)) return seen;
  seen.add(name);
  for (const match of read(name).matchAll(/from "(\.\/[^"]+)"/g)) {
    const local = match[1];
    if (local) collect(local, seen);
  }
  return seen;
}

describe("client directives", () => {
  it("marks every runtime module reachable from the barrel", () => {
    const modules = [...collect("./index.js", new Set())].filter(
      (name) => name !== "./index.js",
    );
    expect(modules.length).toBeGreaterThan(5);
    const missing = modules.filter((name) => {
      const source = read(name);
      return runtime(source) !== "export {};" && !source.startsWith(directive);
    });
    expect(missing).toEqual([]);
  });
});
