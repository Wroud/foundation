import type { ISerializedError } from "./ISerializedError.js";

export function deserializeError(obj: ISerializedError): Error {
  const { name, message, stack, ...extras } = obj;

  // pick constructor by name (TypeError, RangeError, etc.), fallback to Error
  const Ctor =
    typeof name === "string" && typeof (globalThis as any)[name] === "function"
      ? (globalThis as any)[name]
      : Error;

  let error: Error;
  try {
    error = new Ctor(message as string);
  } catch {
    error = new Error(message as string);
    if (name) error.name = name;
  }

  if (stack) {
    error.stack = stack;
  }

  // restore any extra properties
  Object.assign(error, extras);

  return error;
}
