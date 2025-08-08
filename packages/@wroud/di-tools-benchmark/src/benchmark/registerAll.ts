import type { ILibrary } from "@wroud/di-tools-benchmark/common/tools/registerLibrary";
import type { IEntry } from "./IEntry.js";

export function registerAll(
  lib: ILibrary<unknown, unknown, unknown, unknown>,
  builder: unknown,
  entries: IEntry[],
  kind: "singleton" | "transient" | "scoped",
) {
  for (const [token, service] of entries) {
    if (kind === "singleton")
      lib.prepare.registerSingleton(
        builder as never,
        token as never,
        service as never,
      );
    else if (kind === "transient")
      lib.prepare.registerTransient!(
        builder as never,
        token as never,
        service as never,
      );
    else
      lib.prepare.registerScoped!(
        builder as never,
        token as never,
        service as never,
      );
  }
}
