import { Debug } from "../debug.js";

export function resolveGeneratorSync<TResult>(
  iterator: Iterator<Promise<unknown>, TResult, unknown>,
): TResult {
  const first = iterator.next();
  if (first.done) {
    return first.value;
  }

  const err = new Error(Debug.errors.lazyServiceCantResolveSync);

  try {
    if (typeof iterator.throw === "function") {
      try {
        iterator.throw(err);
      } catch {
        /* swallow generator's throw */
      }
    }
  } finally {
    if (typeof iterator.return === "function") {
      try {
        iterator.return();
      } catch {
        /* ignore */
      }
    }
  }

  throw err;
}
