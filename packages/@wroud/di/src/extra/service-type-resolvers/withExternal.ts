import type {
  IResolverServiceType,
  SingleServiceType,
} from "../../types/index.js";
import { ExternalServiceTypeResolver } from "./ExternalServiceTypeResolver.js";

type ExtractValue<T> = T extends SingleServiceType<infer U, any> ? U : never;
type ExtractArgs<T> = T extends SingleServiceType<any, infer U> ? U : never;

type RemapArgs<T> = T extends readonly any[]
  ? { [K in keyof T]: [SingleServiceType<T[K]>, T[K]] }[number][]
  : never;

export function withExternal<T extends SingleServiceType<any, any[]>>(
  service: T,
  externals: RemapArgs<ExtractArgs<T>>,
): IResolverServiceType<ExtractValue<T>, ExtractValue<T>> {
  return new ExternalServiceTypeResolver(service, externals);
}
