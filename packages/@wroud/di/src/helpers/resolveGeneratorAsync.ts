export async function resolveGeneratorAsync<TResult>(
  iterator: Generator<Promise<unknown>, TResult, unknown>,
) {
  let result: IteratorResult<Promise<unknown>, TResult>;

  while (!(result = iterator.next()).done) {
    try {
      await result.value;
    } catch (err) {
      result = iterator.throw(err);

      if (result.done) {
        break;
      }
    }
  }

  return result.value;
}
