export async function resolveGeneratorAsync<TResult>(
  iterator: Iterator<Promise<unknown>, TResult, unknown>,
) {
  let result = iterator.next();

  for (; !result.done; result = iterator.next()) {
    try {
      await result.value;
    } catch (err) {
      if (!iterator.throw) {
        throw err;
      }
      result = iterator.throw(err);
    }
  }

  return result.value;
}
