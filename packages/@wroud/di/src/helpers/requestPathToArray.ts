import type { IRequestPathNode } from "../types/IRequestPathNode.js";

export function* requestPathToArray<T>(
  node: IRequestPathNode<T> | null,
): Generator<T> {
  let current: IRequestPathNode<T> | null = node;
  while (current !== null) {
    yield current.value;
    current = current.next;
  }
}
