import { resolveGeneratorAsync } from "@wroud/di/helpers/resolveGeneratorAsync.js";
import type { IServiceDescriptor } from "@wroud/di/types";

export async function getDeps<T>(descriptor: IServiceDescriptor<T>) {
  const resolved = await resolveGeneratorAsync(
    descriptor.resolver.resolve(
      function* gen(dep, reqBy, mode) {
        return null as any;
      },
      descriptor,
      null,
      { next: null, value: null },
      "async",
      {},
    ),
  );

  return resolved.dependencies;
}
