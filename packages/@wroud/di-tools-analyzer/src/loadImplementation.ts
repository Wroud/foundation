import { resolveGeneratorAsync } from "@wroud/di/helpers/resolveGeneratorAsync.js";
import type { IResolverServiceType, IServiceDescriptor } from "@wroud/di/types";

export async function getDeps<T>(descriptor: IServiceDescriptor<T>) {
  const deps: IResolverServiceType<any, any>[] = [];
  await resolveGeneratorAsync(
    descriptor.resolver.resolve(
      function* gen(dep, reqBy, mode) {
        deps.push(dep);
        return null as any;
      },
      descriptor,
      new Set(),
      "async",
    ),
  );

  return deps;
}
