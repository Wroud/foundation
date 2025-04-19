import type { ISerializedError } from "./ISerializedError.js";

export function serializeError(err: unknown): string {
  if (!(err instanceof Error)) {
    return JSON.stringify({
      name: "Error",
      message: String(err),
    });
  }

  const plain: ISerializedError = {
    name: err.name,
    message: err.message,
    stack: err.stack,
  };

  for (const key of Object.getOwnPropertyNames(err)) {
    if (key !== "name" && key !== "message" && key !== "stack") {
      plain[key] = (err as any)[key];
    }
  }

  return JSON.stringify(plain);
}
