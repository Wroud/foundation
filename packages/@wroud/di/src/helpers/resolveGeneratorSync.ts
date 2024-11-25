import { Debug } from "../debug.js";

export function resolveGeneratorSync<TResult>(
  iterator: Generator<Promise<unknown>, TResult, unknown>,
) {
  let result = iterator.next();

  for (; !result.done; result = iterator.next()) {
    result = iterator.throw(new Error(Debug.errors.lazyServiceCantResolveSync));
  }

  return result.value;
}
