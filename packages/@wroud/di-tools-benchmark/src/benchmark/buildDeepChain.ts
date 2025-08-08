import type { ILibrary } from "@wroud/di-tools-benchmark/common/tools/registerLibrary";
import type { IEntry } from "./IEntry.js";

export function buildDeepChain(
  lib: ILibrary<unknown, unknown, unknown, unknown>,
  depth: number,
) {
  const entries: IEntry[] = [];
  let prev: unknown | null = null;
  let lastToken: unknown;

  for (let k = 0; k < depth; k++) {
    const token = lib.setup.createToken();
    const service = lib.setup.createService(prev ? [prev] : []);
    entries.push([token, service]);
    lastToken = token;
    prev = token;
  }

  return { entries, lastToken: lastToken! };
}
