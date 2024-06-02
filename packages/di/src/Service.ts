export class Service {
  protected dispose(): Promise<void> | void {}

  [Symbol.dispose]() {
    return this.dispose();
  }

  [Symbol.asyncDispose]() {
    return this.dispose();
  }
}
