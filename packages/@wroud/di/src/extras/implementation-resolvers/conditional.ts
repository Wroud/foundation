import type {
  IServiceImplementationResolver,
  ServiceType,
} from "../../types/index.js";
import {
  ConditionalServiceImplementationResolver,
  type IConditionFactory,
} from "./ConditionalServiceImplementationResolver.js";

export function conditional<T, TArgs extends ServiceType<unknown>[]>(
  factory: IConditionFactory<T, TArgs>,
  ...dependencies: TArgs
): IServiceImplementationResolver<T> {
  return new ConditionalServiceImplementationResolver(factory, dependencies);
}
