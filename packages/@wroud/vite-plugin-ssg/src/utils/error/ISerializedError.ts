export interface ISerializedError {
  name?: string;
  message?: string;
  stack?: string;
  [key: string]: unknown;
}
