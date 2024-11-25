export interface IRequestPathNode<T> {
  value: T;
  next: IRequestPathNode<T> | null;
}
