import type { ILibrary } from "@wroud/di-tools-benchmark/common/tools/registerLibrary";
import type { IEntry } from "./IEntry.js";

export function buildLinearTriples(
  lib: ILibrary<unknown, unknown, unknown, unknown>,
  n: number,
) {
  const entries: IEntry[] = [];
  const tokensLeaf: unknown[] = [];
  const tokensAll: unknown[] = [];

  for (let j = 0; j < n; j++) {
    const tokenA = lib.setup.createToken();
    const serviceA = lib.setup.createService([]);
    const tokenB = lib.setup.createToken();
    const serviceB = lib.setup.createService([tokenA]);
    const tokenC = lib.setup.createToken();
    const serviceC = lib.setup.createService([tokenB]);

    entries.push([tokenA, serviceA], [tokenB, serviceB], [tokenC, serviceC]);
    tokensLeaf.push(tokenC);
    tokensAll.push(tokenC, tokenB, tokenA); // reverse order for singleton cache
  }

  return { entries, tokensLeaf, tokensAll };
}
