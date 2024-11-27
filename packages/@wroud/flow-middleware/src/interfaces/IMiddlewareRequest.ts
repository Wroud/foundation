export interface IMiddlewareRequest<Data = Record<string, any>> {
  execute(): Promise<void>;
  dispose(): void;
}
