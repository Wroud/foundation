export async function resolveGeneratorAsync<TResult>(
  iterator: Generator<Promise<unknown>, TResult, unknown>,
) {
  let result = iterator.next();

  for (; !result.done; result = iterator.next()) {
    try {
      await result.value;
    } catch (err) {
      result = iterator.throw(err);
    }
  }

  return result.value;
}
