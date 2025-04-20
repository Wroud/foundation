export class Service implements Disposable, AsyncDisposable {
  protected dispose(): Promise<void> | void {}

  [Symbol.dispose]() {
    return this.dispose();
  }

  async [Symbol.asyncDispose]() {
    return await this.dispose();
  }
}
