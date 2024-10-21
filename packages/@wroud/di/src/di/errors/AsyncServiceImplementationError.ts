export class AsyncServiceImplementationError extends Error {
  constructor() {
    super("Service is not loaded yet");
  }
}
