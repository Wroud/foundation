import type { IServiceImplementationResolver } from "../../types/index.js";
import { ExternalServiceImplementationResolver } from "./ExternalServiceImplementationResolver.js";

export function external<T>(): IServiceImplementationResolver<T> {
  return new ExternalServiceImplementationResolver();
}
