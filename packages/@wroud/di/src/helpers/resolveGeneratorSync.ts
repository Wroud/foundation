import { Debug } from "../debug.js";

export function resolveGeneratorSync<TResult>(
  iterator: Generator<Promise<unknown>, TResult, unknown>,
) {
  let result: IteratorResult<Promise<unknown>, TResult>;

  while (!(result = iterator.next()).done) {
    result = iterator.throw(new Error(Debug.errors.lazyServiceCantResolveSync));

    if (result.done) {
      break;
    }
  }

  return result.value;
}
