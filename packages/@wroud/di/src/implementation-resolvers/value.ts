import { ValueServiceImplementationResolver } from "./ValueServiceImplementationResolver.js";

export function value<T>(implementation: T) {
  return new ValueServiceImplementationResolver(implementation);
}
